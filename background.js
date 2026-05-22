console.log("background.js loaded !");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "bgExtractArticleAndMetadataFromPage") {
        console.log("BACKGROUND EXTRACTING ARTICLE...");
        extractArticleAndMetadata(
            message.rawPageText,
            message.webPageText,
            sender.tab.id
            /*
            message.mainImage
            */
        );
        return true; //async resp
    } else if (message.type === "bgSummarize") {
        backgroundSummarize(message.article, message.summaryLength, message.selectedTone, message.toneDescription, sendResponse);
        return true; //async resp
    }
    else if (message.type === "bgFactCheck") {
        
        console.log("Nous y est");
        console.log(message);
        backgroundFactCheck(message.article);

        

        return true; //async resp
    }
});

async function getOpenAIApiKey() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      if (!config.OPENAI_API_KEY) throw new Error("API key missing in config.json");
      return config.OPENAI_API_KEY;
    } catch (err) {
      console.error('Failed to load config or find value:', err);
      return null; 
}
}

async function getOpenAIApiUrl() {
        try {
          const response = await fetch(chrome.runtime.getURL('config.json'));
          const config = await response.json();
          if (!config.OPENAI_API_URL) throw new Error("API URL missing in config.json");
          return config.OPENAI_API_URL;
        } catch (err) {
          console.error('Failed to load config or find value:', err);
          return null; 
    }
}

async function getOpenAIApiModel() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      if (!config.OPENAI_API_MODEL) throw new Error("API model missing in config.json");
      return config.OPENAI_API_MODEL;
    } catch (err) {
      console.error('Failed to load config or find value:', err);
      return null; 
}
}

async function getOpenAIApiMaxTokensValue() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      if (!config.OPENAI_API_MAX_TOKENS) throw new Error("API max tokens value missing in config.json");
      return config.OPENAI_API_MAX_TOKENS;
    } catch (err) {
      console.error('Failed to load config or find value:', err);
      return null; 
}
}

async function getGoogleCustomSearchApiKey() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      if (!config.GOOGLE_CUSTOM_SEARCH_API_KEY) throw new Error("GOOGLE_CUSTOM_SEARCH_API_KEY missing in config.json");
      return config.GOOGLE_CUSTOM_SEARCH_API_KEY;
    } catch (err) {
      console.error('Failed to load config or find value:', err);
      return null; 
}
}

async function getGoogleCustomSearchApiUrl() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      if (!config.GOOGLE_CUSTOM_SEARCH_API_URL) throw new Error("GOOGLE_CUSTOM_SEARCH_API_URL missing in config.json");
      return config.GOOGLE_CUSTOM_SEARCH_API_URL;
    } catch (err) {
      console.error('Failed to load config or find value:', err);
      return null; 
}
}

async function getGoogleCustomSearchApiResultsNb() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      if (!config.GOOGLE_CUSTOM_SEARCH_API_RESULTSNB) throw new Error("GOOGLE_CUSTOM_SEARCH_API_RESULTSNB missing in config.json");
      return config.GOOGLE_CUSTOM_SEARCH_API_RESULTSNB;
    } catch (err) {
      console.error('Failed to load config or find value:', err);
      return null; 
}
}

async function getGoogleCustomSearchApiResultPerBatchNb() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      if (!config.GOOGLE_CUSTOM_SEARCH_API_RESULTSPERBATCHNB) throw new Error("GOOGLE_CUSTOM_SEARCH_API_RESULTSPERBATCHNB missing in config.json");
      return config.GOOGLE_CUSTOM_SEARCH_API_RESULTSPERBATCHNB;
    } catch (err) {
      console.error('Failed to load config or find value:', err);
      return null; 
}
}

async function getGoogleCustomSearchEngineID() {
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const config = await response.json();
      if (!config.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) throw new Error("GOOGLE_CUSTOM_SEARCH_ENGINE_ID missing in config.json");
      return config.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
    } catch (err) {
      console.error('Failed to load config or find value:', err);
      return null; 
}
}

async function extractArticle(rawPageText) {
    const OpenAI_APIurl = await getOpenAIApiUrl();
    const OpenAI_APIkey = await getOpenAIApiKey();
    const OpenAI_APImodel = await getOpenAIApiModel();
    const OpenAI_APImaxTokens = await getOpenAIApiMaxTokensValue();

    const extractSystemPrompt = "You will be provided with a body of an article. Your task is to extract the full article content and return it as a plain string without any HTML tags or additional formatting. Do not alter the language; keep the content in its original language.";
    const extractUserPrompt = rawPageText;

    const extractedArticleResponse = await fetch(OpenAI_APIurl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OpenAI_APIkey}`
        },
        body: JSON.stringify({
            model: OpenAI_APImodel,
            max_tokens: OpenAI_APImaxTokens,
            store: true,
            messages: [
                {
                    role: "system",
                    content: extractSystemPrompt
                },
                {
                    role: "user",
                    content: extractUserPrompt
                }
            ]
        })
    })

    if (!extractedArticleResponse.ok) {
        try {
            /*
            const errorDetails = await extractedArticleResponse.json();
            */
            const errorDetails = await extractedMetadataResponse.json();
            console.log(errorDetails);
            return `OPENAI API ERROR (EXTRACT ARTICLE CONTENT): ${extractedArticleResponse.status}  ${errorDetails.error.type} - ${errorDetails.error.code} : ${errorDetails.error.message}`;
        } catch (parseError) {
            return `OPENAI API ERROR (EXTRACT ARTICLE CONTENT): ${extractedArticleResponse.status} - Unable to parse error details`;
        }
    }

    const extractedArticleData = await extractedArticleResponse.json();

    const articleText = extractedArticleData.choices[0].message.content;

    return articleText;
}

async function extractMetadata(webPageText) {
    const OpenAI_APIurl = await getOpenAIApiUrl();
    const OpenAI_APIkey = await getOpenAIApiKey();
    const OpenAI_APImodel = await getOpenAIApiModel();
    const OpenAI_APImaxTokens = await getOpenAIApiMaxTokensValue();

   const extractMetadataSystemPrompt = 
`You will be provided with the content of an article from a web page. Your task is to extract and evaluate specific metadata based on predefined criteria. Return all explanations in French, while maintaining the extracted content in the article's original language.

Never hesitate to be harsh on a note, or explanation, if you don't find any content for the value return "Not found" with a score of 50.

### Part 1: Metadata Analysis
For each metadata item, provide:
1. The extracted value (if applicable).
2. An assessment score (out of 100).
3. A brief explanation of the evaluation (focused on the quality and coherence of the information).

Ensure coherence between levels and scores:
- **Poor**: 0-20
- **Low**: 20-40
- **Decent**: 40-60
- **High**: 60-80
- **Very High**: 80-100

#### Evaluation Criteria:
1. **Author**:
   - Deduct points if the author has a history of controversy, criticism, or low-quality work.
   - Include relevant context about the author in the explanation.

2. **Media Reputation**:
   - Summarize controversies, errors, or polemics (especially for satirical or humorous media like "Le Gorafi" or "The Onion").
   - Assign lower scores for severe or recurring issues.
   - Provide a concise explanation of any identified controversies.

3. **Tone of Voice**:
   - Identify the tone (options: Neutral, Sensational, Ironic, Sarcastic, Dramatic).
   - Deduct points for emotional or overly dramatic tones that reduce information quality.

4. **Quotations Quality**:
   - Evaluate the quantity and quality of quotations (options: Poor, Low, Decent, High, Very High).
   - Scores should reflect how well the quotations support the content.

5. **Ambiguity**:
   - Assess clarity and precision (options: Vague, Clear, Scientific).
   - Deduct points for excessive vagueness or lack of detailed explanations.

### Part 2: Additional Indications
For the article or media, provide:

1. **Article Size**:
   - Return the size of the article in words, only return the numerical value.

2. **Unexplained, Unclear, and Ambiguous Terms**:
   - Provide up to 3 terms that are unclear, unexplained, or ambiguous along with their definitions. Use this JSON format:
   {
     "word": "COMPLEX TERM",
     "definition": "THIS TERM MEANS ..."
   }

3. **Political bias**:
   - Indicate the media's political bias (options: Far-left, Left, Center-left, Center, Center-right, Right, Far-right).

4. **Sponsored**:
   - Return a boolean specifying whether the article is sponsored (true or false).

5. **Accessibility**:
   - Provide a short assessment of whether the text is accessible (e.g., simple terms, explained concepts).

6. **Date**:
    - Return the date of the article.
   

Return the results in the following JSON format, and only that:

{
  {
  "analysisMetadata": [
    { "category": "author", "value": "AUTHOR NAME", "explanation": "L’auteur est bien connu, sans controverse notable.", "score": 85 },
    { "category": "mediaReputation", "value": "No significant controversies", "explanation": "Le média n’a pas d’historique notable de polémiques ou d’erreurs.", "score": 90 },
    { "category": "tone", "value": "Neutral", "explanation": "Le ton est factuel et non émotionnel.", "score": 95 },
    { "category": "quotationsQuality", "value": "High", "explanation": "Plusieurs citations fiables et pertinentes.", "score": 85 },
    { "category": "ambiguity", "value": "Clear", "explanation": "Le contenu est bien expliqué avec des termes clairs.", "score": 92 }
  ],
  "indicationsMetadata": [
    { "category": "articleSize", "value": "1200" },
    { 
      "category": "unexplainedTerms", 
      "value": [
        { "word": "Cryptomonnaie", "definition": "Une monnaie numérique décentralisée basée sur la technologie blockchain." },
        { "word": "Inflation", "definition": "Une augmentation générale et prolongée des prix." }
      ]
    },
    { "category": "politicalBias", "value": "Center" },
    { "category": "sponsored", "value": false },
    { "category": "accessibility", "value": "The text uses an clear and explicit language" },
    { "category": "date", "value": "2023-11-01T00:00:00Z" }
  ]
}
`;

    const extractMetadataUserPrompt = webPageText;
    
    console.log("METADATA PROMPTS")

    const extractedMetadataResponse = await fetch(OpenAI_APIurl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OpenAI_APIkey}`
        },
        body: JSON.stringify({
            model: OpenAI_APImodel,
            max_tokens: OpenAI_APImaxTokens,
            store: true,
            messages: [
                {
                    role: "system",
                    content: extractMetadataSystemPrompt
                },
                {
                    role: "user",
                    content: extractMetadataUserPrompt
                }
            ]
        })
    })

    if (!extractedMetadataResponse.ok) {
        try {
            const errorDetails = await extractedMetadataResponse.json();
            console.log(errorDetails);
            return `OPENAI API ERROR (EXTRACT ARTICLE METADATA): ${extractedMetadataResponse.status} - ${errorDetails.error.type} - ${errorDetails.error.code} : ${errorDetails.error.message}`;
        } catch (parseError) {
            return `OPENAI API ERROR (EXTRACT ARTICLE METADATA): ${extractedMetadataResponse.status} - Unable to parse error details`;
        }
    }

    const extractedMetadataData = await extractedMetadataResponse.json();

    const articleMetadata = extractedMetadataData.choices[0].message.content;

    return articleMetadata;
}

/*
function createFallbackMetadata(errorMessage) {
    return JSON.stringify({
        analysisMetadata: [
            {
                category: "author",
                value: "Not found",
                explanation: `Analyse indisponible: ${errorMessage}`,
                score: 50
            },
            {
                category: "mediaReputation",
                value: "Not found",
                explanation: "L'analyse automatique de la reputation du media n'a pas pu etre effectuee.",
                score: 50
            },
            {
                category: "tone",
                value: "Not found",
                explanation: "Le ton de l'article n'a pas pu etre analyse automatiquement.",
                score: 50
            },
            {
                category: "quotationsQuality",
                value: "Not found",
                explanation: "La qualite des citations n'a pas pu etre analysee automatiquement.",
                score: 50
            },
            {
                category: "ambiguity",
                value: "Not found",
                explanation: "L'ambiguite du contenu n'a pas pu etre analysee automatiquement.",
                score: 50
            }
        ],
        indicationsMetadata: [
            {
                category: "articleSize",
                value: "0"
            },
            {
                category: "unexplainedTerms",
                value: []
            },
            {
                category: "politicalBias",
                value: "Not found"
            },
            {
                category: "sponsored",
                value: false
            },
            {
                category: "accessibility",
                value: "Analyse indisponible"
            },
            {
                category: "date",
                value: new Date().toISOString()
            }
        ]
    });
}
*/


async function extractArticleAndMetadata(rawPageText, webPageText, tabId, mainImage) {
    //PROCESS ARTICLE
    console.log("BG EXTRACTING ARTICLE TEXT");
    sendNewMenuLoadingText(tabId, "Extraction de l'article. . .");
    const articleText = await extractArticle(rawPageText);

    //PROCESS METADATA
    console.log("BG EXTRACTING ARTICLE METADATA");
    sendNewMenuLoadingText(tabId, "Étude de l'article. . .")
    /*
    let articleMetadata;
    try {
        articleMetadata = await withTimeout(
            extractMetadata(webPageText),
            10000,
            "Analyse des metadonnees trop longue."
        );
    } catch (error) {
        console.error("Metadata extraction error:", error);
        articleMetadata = createFallbackMetadata(error.message);
    }
    */
    const articleMetadata = await extractMetadata(webPageText);

    /*
    let hiveAnalysis = mainImage
        ? { error: "Analyse Hive desactivee temporairement pour eviter le blocage de l'affichage." }
        : null;
    */

    if ((articleText && articleText.startsWith("OPENAI API ERROR")) || (articleMetadata && articleMetadata.startsWith("OPENAI API ERROR"))) {
        let errorMessage = "";
        if (articleText && articleText.startsWith("OPENAI API ERROR")) {
             errorMessage = articleText;
        } else if (articleMetadata && articleMetadata.startsWith("OPENAI API ERROR")) {
             errorMessage = articleMetadata;
        } else {
            errorMessage = "Unknown API Error when trying to extract the article and its metadata";
        }

        console.log("ERROR")
        console.log(articleText)
        console.log(articleMetadata)
        console.log(errorMessage)

        chrome.tabs.sendMessage(tabId, {
            type: "tabSendArticleAndMetadata",
            error: `Summary API Error: ${errorMessage}`
        });

        return;
    }

    chrome.tabs.sendMessage(tabId, {
        type: "tabSendArticleAndMetadata",
        articleText: articleText,
        articleMetadata: articleMetadata,
        /*
        hiveAnalysis: hiveAnalysis,
        mainImage: mainImage
        */
    });

    return true;
}

/*
function withTimeout(promise, timeoutMs, timeoutMessage) {
    let timeoutId;
    const timeoutPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}
*/

async function sendNewMenuLoadingText(tabId, text) {
    chrome.tabs.sendMessage(tabId, {
        type: "tabSendNewMenuLoadingText",
        loadingText: text
    });
}

//SUMMARY
async function backgroundSummarize(articleText, summaryLength, selectedTone, toneDescription, sendResponse) {
    console.log("BG SUMMARIZE")
    const summarySystemPrompt = "You will be provided with an article. Your task is to summarize the article, with a length of around " + (summaryLength * 50) + " words." + "Your analysis and summary content must have a " + selectedTone + " tone: " + toneDescription + " Do not add additional text; just send the summary.";
    const summaryUserPrompt = articleText;

    const OpenAI_APIurl = await getOpenAIApiUrl();
    const OpenAI_APIkey = await getOpenAIApiKey();
    const OpenAI_APImodel = await getOpenAIApiModel();
    const OpenAI_APImaxTokens = await getOpenAIApiMaxTokensValue();

    const articleSummaryResponse = await fetch(OpenAI_APIurl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OpenAI_APIkey}`
        },
        body: JSON.stringify({
            model: OpenAI_APImodel,
            max_tokens: OpenAI_APImaxTokens,
            store: true,
            messages: [
                {
                    role: "system",
                    content: summarySystemPrompt
                },
                {
                    role: "user",
                    content: summaryUserPrompt
                }
            ]
        })
    })

    if (!articleSummaryResponse.ok) {
        console.error(articleSummaryResponse.status, articleSummaryResponse.statusText)
        return;
    }

    const articleSummaryData = await articleSummaryResponse.json();
    const summaryContent = articleSummaryData.choices[0].message.content;

    //background.js => popup.js
    chrome.runtime.sendMessage({
        type: "displaySummaryInPopup",
        summaryContent: summaryContent
    });


    return true;
}


// tests FactCheck

async function fetchGoogleResults(query) {
    const base_url = await getGoogleCustomSearchApiUrl();
    const gcs_api_key = await getGoogleCustomSearchApiKey();
    const gcs_engine_id = await getGoogleCustomSearchEngineID();
    const gcs_results_maxNb = await getGoogleCustomSearchApiResultsNb();
    const gcs_results_perBatch_nb = await getGoogleCustomSearchApiResultPerBatchNb();

    const url = `${base_url}?q=${encodeURIComponent(query)}&key=${gcs_api_key}&cx=${gcs_engine_id}&num=${gcs_results_perBatch_nb}`;
    
    let results = [];
    try {
        for (let start = 1; start <= gcs_results_maxNb; start += gcs_results_perBatch_nb) { // Fetch results in batches (Google API allows max 10 per request)
            const response = await fetch(`${url}&start=${start}`);
            const data = await response.json();

            if (data.items) {
                data.items.forEach((item) => {
                    results.push({
                        title: item.title,
                        snippet: item.snippet,
                        link: item.link
                    });
                });
            }
        }

        console.log("Extracted Results:", results);
        return results;

    } catch (error) {
        console.error("Error fetching Google search results:", error);
    }
}

async function checkByGPTResearch(claim) {

    const factsCheckSystemPrompt = `
    You are an assistant specialized in fact-checking. Your goal is to assess the truthfulness of the user's claim.

1. Search for reliable and verified sources that confirm or refute this claim.  
2. Analyze the general consensus of the sources found to estimate the credibility of the claim.  
3. Assign a truthfulness score from 0 to 10, where:  
   - 0 means completely false,  
   - 10 means fully verified.  
4. Format your response in JSON using one of the following three structures:  

   - If the claim is partially true or uncertain (score between 4 and 6):  

     {
       "note": [score between 4 and 6],
       "source": "urlSource"
     }

   - If the claim is generally true (score between 7 and 10):  

     {
       "veracity": true,
       "note": [score between 7 and 10],
       "source": "urlSource"
     }

   - If the claim is generally false (score between 0 and 4):  

     {
       "veracity": false,
       "note": [score between 0 and 4],
       "source": "urlSource"
     }

5. Return only the final JSON, with no additional text.  
6. Ensure the response remains in French
7. At the end the note atttribute must be an number not a list.
`;

    const factsUserPrompt = claim;

    const OpenAI_APIurl = await getOpenAIApiUrl();
    const OpenAI_APIkey = await getOpenAIApiKey();
    const OpenAI_APImodel = await getOpenAIApiModel();
    const OpenAI_APImaxTokens = await getOpenAIApiMaxTokensValue();

    const result = await fetch(OpenAI_APIurl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OpenAI_APIkey}`
        },
        body: JSON.stringify({
            model: OpenAI_APImodel,
            max_tokens: OpenAI_APImaxTokens,
            store: true,
            messages: [
                {
                    role: "system",
                    content: factsCheckSystemPrompt
                },
                {
                    role: "user",
                    content: factsUserPrompt
                }
            ]
        })
    });

    if (!result.ok) {
        console.error(result.status, result.statusText);
        return;
    }

    const factsData = await result.json();
    console.log("Réponse brute de l'API OpenAI:", factsData);

    if (!factsData.choices || !factsData.choices[0] || !factsData.choices[0].message) {
        console.error("Structure de la réponse API inattendue:", factsData);
        return;
    }

    const factsContent = factsData.choices[0].message.content;
    console.log("Contenu des faits extrait:", factsContent);

    let factsJson;
    try {
        factsJson = JSON.parse(factsContent);
    } catch (error) {
        console.error("Échec de l'analyse JSON depuis la réponse:", error);
        return;
    }

    return factsJson;
}



async function backgroundFactCheck(articleText) {
    console.log("Début de la vérification des faits...");

    // Configuration de l'API
    const FactCheck_APIurl = "https://factchecktools.googleapis.com/v1alpha1/claims:search";
    const FactCheck_APIkey = "AIzaSyANkn-Turh2zQZwMu0NMEwLwTzwVQB4Z-g";

    // Découper l'article en phrases ou affirmations clés
    const claimsToCheck = await extractKeyClaims(articleText); // Ajout du await ici

    const concatenatedResults = [];

    console.log("VerifGoogle");
    for (const claim of claimsToCheck) {

        const factCheckUrl = `${FactCheck_APIurl}?query=${encodeURIComponent(claim)}&key=${FactCheck_APIkey}`;
        let resultFromGoogleFactCheckAPI = null;
        try {
            // Appel à l'API
            const factCheckResponse = await fetch(factCheckUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!factCheckResponse.ok) {
                console.error("Erreur de la requête :", factCheckResponse.status, factCheckResponse.statusText);
                continue;
            }

            const resultFromGoogleFactCheckAPI = await factCheckResponse.json();

       

        const googleSearches = await fetchGoogleResults(claim);
        const resultFromGoogleSearch = await askVerifFromGPT(googleSearches);
        
        concatenatedResults.push({
            claim: claim,
            googleFactCheck: resultFromGoogleFactCheckAPI,
            googleSearchResult: resultFromGoogleSearch,
            GPTResearch: null // Placeholder for now
        });

    } catch (error) {
        console.error("Erreur lors de la requête :", error);
    }

    }
        
    console.log("VerifGPT");
    for (const entry of concatenatedResults) {
        const resultFromGPTSearch = await checkByGPTResearch(entry.claim);
        entry.GPTResearch = resultFromGPTSearch;
    }

    //background.js => popup.js
    chrome.runtime.sendMessage({
        type: "displayFactCheckOnPopup",
        factCheckInformations: concatenatedResults
    });

    const jsonInfos = JSON.stringify(concatenatedResults, null, 2);

}

async function askVerifFromGPT(googleSearches) {

    const factsCheckSystemPrompt = `
    You are an AI assistant specialized in fact-checking. Your task is to analyze Google search results and determine the accuracy of a claim based on these sources.

### Instructions :
1. Analyze the results provided by the user, which are in JSON format.
2. Evaluate the veracity of the claim based on the consensus among sources.
3. Assign a truthfulness score on a scale from 0 to 10:
   - **0 to 3**: Mostly false or misleading.
   - **4 to 6**: Partially true or uncertain.
   - **7 to 10**: Generally true.
4. Choose a source that must be the most reliable among the available results (institutional site, recognized media, scientific source) and return its URL.
5. Assess the veracity of the fact (0 to 3 score: veracity = false, 4 to 6 score: veracity = null, 7 to 10 score: veracity = true)
5. If no conclusion can be drawn, return "note": 5 and an empty string for the source, and null for the veracity.
6. Return the response strictly in the following JSON format:
     {
       "note": score,
       "source": "urlSource",
       "veracity": null
     }

Respond **only** with the JSON, without any additional text.
`;

    const factsUserPrompt = JSON.stringify(googleSearches);

    const OpenAI_APIurl = await getOpenAIApiUrl();
    const OpenAI_APIkey = await getOpenAIApiKey();
    const OpenAI_APImodel = await getOpenAIApiModel();
    const OpenAI_APImaxTokens = await getOpenAIApiMaxTokensValue();

    const result = await fetch(OpenAI_APIurl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OpenAI_APIkey}`
        },
        body: JSON.stringify({
            model: OpenAI_APImodel,
            max_tokens: OpenAI_APImaxTokens,
            store: true,
            messages: [
                {
                    role: "system",
                    content: factsCheckSystemPrompt
                },
                {
                    role: "user",
                    content: factsUserPrompt
                }
            ]
        })
    });

    if (!result.ok) {
        console.error(result.status, result.statusText);
        return;
    }

    const factsData = await result.json();
    console.log("Réponse brute de l'API OpenAI:", factsData);

    if (!factsData.choices || !factsData.choices[0] || !factsData.choices[0].message) {
        console.error("Structure de la réponse API inattendue:", factsData);
        return;
    }

    const factsContent = factsData.choices[0].message.content;
    console.log("Contenu des faits extrait:", factsContent);

    let factsJson;
    try {
        factsJson = JSON.parse(factsContent);
    } catch (error) {
        console.error("Échec de l'analyse JSON depuis la réponse:", error);
        return;
    }

    return factsJson;
}



async function extractKeyClaims(articleText, sendResponse) {
    console.log("BG EXTRACT FACTS");
    const factsSystemPrompt = `
You will be given a news article in French. Your task is to extract and summarize the key factual statements from the article. Each fact should be a clear, verifiable claim, containing as much detail as possible while remaining concise even if YOU find it false.
Those facts can be false or wrong, your job is not to assess if a fact is true or not, also return statement that u find false.
Infact, return false factual statements !

Please follow these instructions:
1. **Maximize precision**: Include key elements such as names, locations, and dates when they are relevant for fact-checking.
2. **Preserve numerical details**: Keep specific numbers and quantities if they are essential for understanding the claim.
3. **Avoid excessive rewording**: Retain the core meaning of statements rather than generalizing or simplifying them.
4. **Fact-based claims only**: Extract statements that can be independently verified and avoid opinions or speculative claims.
5. **Return facts as an array of strings in French**, with each string representing a single fact.
6. **If no factual statements can be extracted, return an empty array**.

### Example:
**Input:**  
*"La Coupe du Monde de 2022 se déroulera au Qatar. Sept nouveaux stades écologiques sont en construction, et le pays investit 220 milliards de dollars dans les infrastructures."*

**Output:**  
[
  "La Coupe du Monde 2022 se déroule au Qatar",  
  "Sept nouveaux stades écologiques en construction au Qatar",  
  "Le Qatar investit 220 milliards de dollars dans les infrastructures"
]

Your task is to extract precise factual claims from the following article:
`;

    const factsUserPrompt = articleText;

    const OpenAI_APIurl = await getOpenAIApiUrl();
    const OpenAI_APIkey = await getOpenAIApiKey();
    const OpenAI_APImodel = await getOpenAIApiModel();
    const OpenAI_APImaxTokens = await getOpenAIApiMaxTokensValue();

    const factsResponse = await fetch(OpenAI_APIurl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OpenAI_APIkey}`
        },
        body: JSON.stringify({
            model: OpenAI_APImodel,
            max_tokens: OpenAI_APImaxTokens,
            store: true,
            messages: [
                {
                    role: "system",
                    content: factsSystemPrompt
                },
                {
                    role: "user",
                    content: factsUserPrompt
                }
            ]
        })
    });

    if (!factsResponse.ok) {
        console.error(factsResponse.status, factsResponse.statusText);
        return;
    }

    const factsData = await factsResponse.json();
    console.log("Réponse brute de l'API OpenAI:", factsData);

    if (!factsData.choices || !factsData.choices[0] || !factsData.choices[0].message) {
        console.error("Structure de la réponse API inattendue:", factsData);
        return;
    }

    const factsContent = factsData.choices[0].message.content;
    console.log("Contenu des faits extrait:", factsContent);

    let factsJson;
    try {
        factsJson = JSON.parse(factsContent);
    } catch (error) {
        console.error("Échec de l'analyse JSON depuis la réponse:", error);
        return;
    }

    return factsJson;
}
async function loadConfig() {
    const response = await fetch(chrome.runtime.getURL("config.json"));
    return await response.json();
}

/*
function assertHiveImageUrl(imageUrl) {
    if (!imageUrl) {
        throw new Error("Aucune image principale n'a ete detectee pour l'analyse Hive.");
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(imageUrl);
    } catch (error) {
        throw new Error(`URL d'image invalide pour Hive: ${imageUrl}`);
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error(`Hive ne peut analyser qu'une URL publique HTTP/HTTPS, pas: ${parsedUrl.protocol}`);
    }
}

async function readHiveResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return await response.json();
    }

    return {
        message: await response.text()
    };
}
*/

/*
async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(`API timeout apres ${Math.round(timeoutMs / 1000)} secondes`);
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}
*/

/*
async function analyzeImageWithHive(imageUrl) {
    const config = await loadConfig();

    if (!config.HIVE_API_KEY) {
        throw new Error("Cle API Hive manquante dans config.json");
    }
    if (!config.HIVE_API_URL) {
        throw new Error("URL API Hive manquante dans config.json");
    }

    assertHiveImageUrl(imageUrl);
    console.log("IMAGE SENT TO HIVE:", imageUrl);

    const formData = new FormData();
    formData.append("url", imageUrl);
    formData.append("models", JSON.stringify(["ai_generated_media"]));
    formData.append("user_id", "veritale_user");
    formData.append("post_id", crypto.randomUUID());

    const response = await fetchWithTimeout(config.HIVE_API_URL, {
        method: "POST",
        headers: {
            "accept": "application/json",
            "authorization": `Token ${config.HIVE_API_KEY}`
        },
        body: formData
    }, 10000);

    const data = await readHiveResponse(response);

    if (!response.ok) {
        throw new Error(`Hive API error ${response.status}: ${JSON.stringify(data)}`);
    }

    return data;
}
*/

