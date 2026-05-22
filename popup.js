document.addEventListener("DOMContentLoaded", async () => {
  console.log("popup.js loaded !");

  //SETUP GALLERIE
  const wrapper = document.querySelector(".features-wrapper");
  const items = document.querySelectorAll(".features-item");
  const leftArrow = document.getElementById("left-arrow");
  const rightArrow = document.getElementById("right-arrow");

  let currentIndex = 0;

  const updateGallery = () => {
    const offset = -currentIndex * 300; // Adjust the 300px width to match your .gallery-item width
    wrapper.style.transform = `translateX(${offset}px)`;
  };

  leftArrow.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateGallery();
    }
  });

  rightArrow.addEventListener("click", () => {
    if (currentIndex < items.length - 1) {
      currentIndex++;
      updateGallery();
    }
  });

  createUpdateMenuLoadingTextListener();

  hideMenu();
  
  updateMenuLoadingText("Récupération de l'article et de ses métadonnées. . .");
    let articleText, articleMetadata, tabDomain, hiveAnalysis, mainImage;

    try {
        ({ articleText, articleMetadata, tabDomain, hiveAnalysis, mainImage } = await getArticleAndMetadataFromTab());
    } catch (error) {
        console.error("Erreur pendant la récupération :", error);
        updateMenuLoadingText("Erreur pendant l'analyse. Regarde la console.");
        return;
    }
  console.log(tabDomain, articleText, articleMetadata)

  //APPLY BLACKLSIT OR WHITELIST
  const mediaRepBlacklist = await getMediaReputationBlacklistFromConfig();
  console.log(mediaRepBlacklist);

  
  if (articleMetadata.analysisMetadata) {
    if (mediaRepBlacklist.includes(tabDomain)) {
      let item = articleMetadata.analysisMetadata.find(entry => entry.category === "mediaReputation")
        if(item)
        {
            item.score = Math.max(0, item.score - 50);
        }
      
    }  
  }

 
  updateMenuLoadingText("Affichage des résultats. . .");
  await new Promise(resolve => setTimeout(resolve, 1000));

  showMenu();
  displayMetadataResults(articleMetadata, articleText);
  displayHiveResult(hiveAnalysis, mainImage);
  

  //ONCLICK
  handleSummaryButton(articleText);
  handleFactCheckButton(articleText);

  //WHEN RESULT
  displaySummaryOnPopup();
  displayFactCheckOnPopup();
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "displayHiveAnalysisInPopup") {
            displayHiveResult(message.hiveAnalysis, message.mainImage);
        }
    });

  

  //BOUTON FACT CHECK
});
function displayHiveResult(hiveAnalysis, mainImage) {
    const indicationsDiv = document.getElementById("hive-analysis");
    indicationsDiv.innerHTML ="";
    const itemDiv = document.createElement("div");
    itemDiv.className = "metadata-item-indications";
    itemDiv.style.backgroundColor = "#343232";
    itemDiv.style.backgroundColor = "#343232";
    itemDiv.style.width = "300px";
    itemDiv.style.margin = "0 auto";
    itemDiv.style.padding = "10px";
    itemDiv.style.boxSizing = "border-box";
    itemDiv.style.overflow = "hidden";

    const title = document.createElement("p");
    title.textContent = "Analyse image Hive";
    itemDiv.appendChild(title);

    if (mainImage) {
        const img = document.createElement("img");
        img.src = mainImage;
        img.alt = "Image analysée";
        img.style.width = "100%";
        img.style.maxWidth = "260px";
        img.style.height = "160px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "8px";
        img.style.display = "block";
        img.style.margin = "10px auto";
        itemDiv.appendChild(img);
    }

    const result = document.createElement("p");
    result.style.fontSize = "12px";
    result.style.wordBreak = "break-word";
    if(!mainImage){result.textContent = "Aucune image principale détectée.";}
    else if (!hiveAnalysis) {
        result.textContent = "Analyse Hive en cours...";
    } else if (hiveAnalysis.error) {
        result.textContent = `Erreur Hive : ${hiveAnalysis.error}`;
    } else {
        result.textContent = "Résultat Hive reçu. Voir console pour détails.";
        console.log("Hive analysis:", hiveAnalysis);
    }

    itemDiv.appendChild(result);
    indicationsDiv.appendChild(itemDiv);
}
function updateMenuLoadingText(newText) {
  const menuLoadingText = document.getElementById("menu-loading-text");

  menuLoadingText.textContent = newText;
}

function createUpdateMenuLoadingTextListener(newText) {
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) { 
    if (message.type === "sendNewMenuLoadingTextToPopup") {
    updateMenuLoadingText(message.loadingText || "Chargement en cours. . .");
    }
  });
}

function hideMenu() {
  const menuSpinner = document.getElementById("menu-loading-spinner");
  const menu = document.getElementById("menu");

  const leftArrow = document.getElementById("left-arrow");
  const rightArrow = document.getElementById("right-arrow");

  const disclaimer = document.getElementById("sticky-disclaimer-footer");

  menuSpinner.style.display = 'flex';
  menu.style.display = 'none';

  leftArrow.style.display = 'none';
  rightArrow.style.display = 'none';

  disclaimer.style.display = 'block';
}

function showMenu() {
  const menuSpinner = document.getElementById("menu-loading-spinner");
  const menu = document.getElementById("menu");

  const leftArrow = document.getElementById("left-arrow");
  const rightArrow = document.getElementById("right-arrow");

  const disclaimer = document.getElementById("sticky-disclaimer-footer");

  menuSpinner.style.display = 'none';
  menu.style.display = 'block';

  leftArrow.style.display = 'inline-block';
  rightArrow.style.display = 'inline-block';

  disclaimer.style.display = 'none';
}

async function getMediaReputationWhitelistFromConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    const config = await response.json();
	if (!config.MEDIA_REPUTATION) throw new Error("MEDIA_REPUTATION missing in config.json");
    if (!config.MEDIA_REPUTATION.WHITELIST) throw new Error("MEDIA_REPUTATION.WHITELIST missing in config.json");
    return config.MEDIA_REPUTATION.WHITELIST;
  } catch (err) {
    console.error('Failed to load config or find value:', err);
    return null; 
}
}

async function getMediaReputationBlacklistFromConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    const config = await response.json();
    if (!config.MEDIA_REPUTATION) throw new Error("MEDIA_REPUTATION missing in config.json");
    if (!config.MEDIA_REPUTATION.BLACKLIST) throw new Error("MEDIA_REPUTATION.BLACKLIST missing in config.json");
    return config.MEDIA_REPUTATION.BLACKLIST;
  } catch (err) {
    console.error('Failed to load config or find value:', err);
    return null; 
}
}


async function getArticleAndMetadataFromTab() {
  return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
          reject("Timeout : aucune réponse reçue depuis l'onglet ou le background.");
      }, 30000);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) {
              clearTimeout(timeoutId);
              reject("No active tab found.");
              return;
          }

          console.log("ARTICLE TAB ID IS ", tabs[0].id)
          chrome.tabs.sendMessage(tabs[0].id, { type: "tabExtractArticleAndMetadata",     tabUrl: tabs[0].url
          }, );

          chrome.runtime.onMessage.addListener(function handleResponse(message) {
              if (message.type === "sendArticleAndMetadataToPopup") {
                  chrome.runtime.onMessage.removeListener(handleResponse); // Avoid duplicate listeners
                  

                  if (message.error) {
                      clearTimeout(timeoutId);
                      reject(message.error);
                  } else {
                      clearTimeout(timeoutId);
                      resolve({
                        articleText: message.articleText,
                        articleMetadata: JSON.parse(message.articleMetadata),
                        tabDomain: message.tabDomain,
                        hiveAnalysis: message.hiveAnalysis,
                        mainImage: message.mainImage,
                          
                      });
                      
                  }
              }
          });
      });
  });
}

function getColorForScore(score) {
  let color;

if (score <= 20) {
    color = "rgb(255, 0, 0)"; // Red
} else if (score <= 40) {
    color = "rgb(255, 128, 0)"; // Orange
} else if (score <= 60) {
    color = "rgb(255, 255, 0)"; // Yellow
} else if (score <= 80) {
    color = "rgb(128, 255, 0)"; // Yellow-Green
} else {
    color = "rgb(0, 255, 0)"; // Green
}

return color;
}

function getColorForTotalScore(totalScore) {
  let color;

  if (totalScore <= 100) {
      color = "rgb(255, 0, 0)"; // 🔴 Red
  } else if (totalScore <= 200) {
      color = "rgb(255, 102, 0)"; // 🟠 Reddish-Orange
  } else if (totalScore <= 300) {
      color = "rgb(255, 204, 0)"; // 🟡 Yellow-Orange
  } else if (totalScore <= 400) {
      color = "rgb(255, 255, 0)"; // 🟡 Yellow
  } else if (totalScore <= 500) {
      color = "rgb(128, 255, 0)"; // 🟢 Yellow-Green
  } else {
      color = "rgb(0, 255, 0)"; // 🟢 Green
  }

  return color;
}

function displayMetadataResults(jsonData, article) {
  //DISPLAY ANALYSIS
  const metadataAnalysisDiv = document.getElementById("metadata-analysis");

  const analysisTranslationMap = {
    author: "Auteur",
    mediaReputation: "Réputation du média",
    tone: "Ton de l'article",
    quotationsQuality: "Qualité des citations",
    ambiguity: "Ambiguïté du propos"
  };
  
  let score = 0;

  // Loop through the articleMetadata array and append to the div
  jsonData.analysisMetadata.forEach((item) => {
  // Loop through the keys of each metadata object
  for (const [key, value] of Object.entries(item)) {
    if (key === "value" || key === "score" || key === "explanation") {
      // Skip the score key because we handle it directly
      continue;
    }
    
    score += item.score;

    // Translate the key using the map
    const translatedCategory = analysisTranslationMap[value] || value;

    // Create a container div for each metadata item
    const itemDiv = document.createElement("div");
    itemDiv.className = "metadata-item-analysis"; // Add a class for styling

    // Create a paragraph to display the score with a tooltip for the explanation
    const scoreParagraph = document.createElement("p");
    scoreParagraph.textContent = `${translatedCategory}: ${item.value} - ${item.score} / 100`;
    scoreParagraph.title = item.explanation; // Add the explanation as a tooltip
    itemDiv.appendChild(scoreParagraph);
    itemDiv.style.backgroundColor = getColorForScore(item.score)
    
    // Append the constructed item div to the metadataAnalysisDiv
    metadataAnalysisDiv.appendChild(itemDiv);
  }});

  const totalScoreDiv = document.createElement("div");
  totalScoreDiv.className = "metadata-item-analysis";
  const scoreParagraph = document.createElement("p");
  scoreParagraph.textContent = `Score: ${score} / 600`;
  totalScoreDiv.style.backgroundColor = getColorForTotalScore(score)

  totalScoreDiv.appendChild(scoreParagraph);

  const hrSpacing = document.createElement("hr");
  hrSpacing.style.border = "0.5px solid #6f6b6b";
  hrSpacing.style.width = "80%";
  
  metadataAnalysisDiv.appendChild(hrSpacing);
  metadataAnalysisDiv.appendChild(totalScoreDiv);


  //DISPLAY INDICATIONS
  const indicationsAnalysisDiv = document.getElementById("metadata-indications");

    const indicationsTranslationMap = {
      articleSize: "Taille de l'article",
      unexplainedTerms: "Termes non expliqués",
      politicalBias: "Orientation politique",
      sponsored: "Sponsorisé",
      accessibility: "Accessibilité",
      date: "Date"
    };

    jsonData.indicationsMetadata.forEach((item) => {
      // Loop through the keys of each metadata object
      for (const [key, value] of Object.entries(item)) {
        if (key === "value") {
          // Skip the score key because we handle it directly
          continue;
        }
        
        let cancelDivCreation = false;
        
        // Translate the key using the map
        const translatedTitle = indicationsTranslationMap[value] || value;
    
        // Create a container div for each metadata item
        const itemDiv = document.createElement("div");
        itemDiv.className = "metadata-item-indications"; // Add a class for styling
        itemDiv.style.backgroundColor = "#343232";

        if (item.category === "articleSize") {
          const nbWords = countWords(article);
          const WPM = 160; //SLOW 100 WPM, AVERAGE 130 WPM, FAST 160 WPM

          const paragraph = document.createElement("p");

          paragraph.textContent = `${translatedTitle}: ${nbWords} mots (${convertSecondsToMinutes(nbWords*(60/(WPM*2)))})`;
          itemDiv.appendChild(paragraph);
        }

        else if (isParsableOrBoolean(item.value)) {
          const label = document.createElement("label");
          label.htmlFor  = "indications-sponsorise"
          label.textContent = translatedTitle;

          const checkbox = document.createElement("input");
          checkbox.id = "indications-sponsorise"
          checkbox.type = "checkbox";
          checkbox.style.marginLeft = "20px";
          checkbox.disabled = true;

          checkbox.checked = typeof item.value === "boolean" 
          ? item.value 
          : item.value.toLowerCase() === "true";
          
          itemDiv.appendChild(label);
          itemDiv.appendChild(checkbox);        
        } else if (isParsableOrDate(item.value)) {
          const label = document.createElement("label");
          label.htmlFor  = "indications-date"
          label.textContent = translatedTitle;

          const date = document.createElement("input");
          date.style.marginLeft = "20px";
          date.id = "indications-date"
          date.type = "date";
          date.disabled = true;

          const parsedDate = new Date(item.value);
  if (!isNaN(parsedDate.getTime())) {
    date.value = parsedDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  }

  itemDiv.appendChild(label);
  itemDiv.appendChild(date);


        } else if (Array.isArray(item.value)) {

          if (item.value.length > 0) {
          const termsList = document.createElement("ul");
          termsList.style.marginRight = "30px";

          item.value.forEach((term) => {
            const termsListElement = document.createElement("li");
            termsListElement.textContent = `${term.word}: ${term.definition}`;

            termsList.appendChild(termsListElement);
          });

          itemDiv.appendChild(termsList)
        } else {
          cancelDivCreation = true;
        }
        }
        else {
          const paragraph = document.createElement("p");

          paragraph.textContent = `${translatedTitle}: ${item.value}`;
          itemDiv.appendChild(paragraph);
        }
        
        if (!cancelDivCreation) {
          // Append the constructed item div to the metadataAnalysisDiv
        indicationsAnalysisDiv.appendChild(itemDiv);
        }
        

    

  }
}

);

  


  
}
function countWords(str) {
  if (typeof str !== "string" || str.trim() === "") {
    return 0; // Return 0 for empty or invalid input
  }

  return str.trim().split(/\s+/).length;
}


function convertSecondsToMinutes(seconds) {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) {
    return "Invalid input"; // Handle invalid cases
  }

  if (seconds < 60) {
    return `${Math.floor(seconds)}s`; // Remove decimals from seconds
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60); // Remove decimals from remaining seconds

  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}

function parseOrReturnInt(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value; // Already an integer
  }
  if (typeof value === "string") {
    const parsedInt = parseInt(value, 10);
    if (!isNaN(parsedInt) && parsedInt.toString() === value.trim()) {
      return parsedInt; // Successfully parsed
    }
  }
  return 0; // Default fallback
}

function isParsableOrBoolean(value) {
  if (typeof value === "boolean") {
    return true; // Already a boolean
  }
  if (typeof value === "string") {
    // Check if it's parsable as "true" or "false"
    return value.toLowerCase() === "true" || value.toLowerCase() === "false";
  }
  return false;
}

function isParsableOrDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return true; // Already a valid Date object
  }
  if (typeof value === "string") {
    // Try parsing it as a date
    const parsedDate = new Date(value);
    return !isNaN(parsedDate.getTime());
  }
  return false;
}

function isParsableOrInt(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return true; // Already an integer
  }
  if (typeof value === "string") {
    // Try parsing as an integer
    const parsedInt = parseInt(value, 10);
    return !isNaN(parsedInt) && parsedInt.toString() === value.trim();
  }
  return false;
}

function handleSummaryButton(article) {
  const summaryBtn = document.getElementById("summary-btn");

  summaryBtn.addEventListener("click", () => {
    console.log("Summary Detected 1");
    const summarySpinner = document.getElementById("summary-loading-spinner");
    summarySpinner.style.display = 'block';
    summaryBtn.style.display = 'none';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      //Get user inputs
      const summaryLengthRange = document.getElementById("summary-user-length");
      const summaryLength = summaryLengthRange.value;

      const summaryToneSelect = document.getElementById("summary-user-tone");
      const selectedOption = summaryToneSelect.options[summaryToneSelect.selectedIndex];
      const selectedTone = selectedOption.value;
      const toneDescription = selectedOption.getAttribute('data-description');

      //popup.js => background.js
      chrome.runtime.sendMessage({
        type: "bgSummarize",
        article,
        summaryLength,
        selectedTone,
        toneDescription
    });
      
    });
  });
}

function displaySummaryOnPopup() {
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "displaySummaryInPopup") {
      
      const summaryContentContainer = document.querySelector(".summary-content-container");
      const summaryContent = document.getElementById("summary-content");
      const closeButton = document.getElementById("summary-close-btn");
      const summarySpinner = document.getElementById("summary-loading-spinner");
      const summaryBtn = document.getElementById("summary-btn");

      if (summaryContent) {
        summaryContent.textContent = message.summaryContent;
        summaryContentContainer.style.display = "flex";


        summarySpinner.style.display = 'none';

        closeButton.addEventListener("click", function () {
          summaryContent.textContent = "";
          summaryContentContainer.style.display = "none";

          closeButton.style.display = "none";
          summaryBtn.style.display = "inline-block";
        });

        closeButton.style.display = "inline-block";

      }
    }
  });
}


// Tests FactChecking

function handleFactCheckButton(article) {
  
  const factCheckBtn = document.getElementById("factcheck-btn");

  const factCheckSpinner = document.getElementById("fact-check-loading-spinner");
  const closeButton = document.getElementById("fact-check-close-btn");


  factCheckBtn.addEventListener("click", () => {
    factCheckSpinner.style.display = 'block';
    factCheckBtn.style.display = 'none';
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      //popup.js => background.js
      chrome.runtime.sendMessage({
        type: "bgFactCheck",
        article
    });
      
    });
  });
}


function displayFactCheckOnPopup() {
  

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    const closeButton = document.getElementById("fact-check-close-btn");
    const factCheckSpinner = document.getElementById("fact-check-loading-spinner");
    const factCheckBtn = document.getElementById("factcheck-btn");

    if (message.type === "displayFactCheckOnPopup") {

      //HIDE SPINNERS, CLOSE BTN ETC  
      factCheckSpinner.style.display = 'none';

      closeButton.addEventListener("click", function () {
        const listDiv = document.getElementById("fact-check-list")
        
        while (listDiv.firstChild) {
          listDiv.removeChild(listDiv.firstChild);
          } 
        //closeButton.style.display = "none";
        factCheckBtn.style.display = "inline-block";
      });

      closeButton.style.display = "inline-block";
      
      console.log("arrivé !");
      console.log(message.factCheckInformations);

      const factCheckInfos = message.factCheckInformations;
      console.log(factCheckInfos)
      if (factCheckInfos) {
        //DISPLAY CONTENT
        const listDiv = document.getElementById("fact-check-list")

          //LOOP THROUGH ELEMENTS
        for (const entry of factCheckInfos) {
          console.log(entry);
          const entryDiv = document.createElement("div");
          entryDiv.className = "fact-check-list-element";

          //TITLE = CLAIM
          const entryDivTitle = document.createElement("h3");
          
          entryDivTitle.textContent = entry.claim;

          const totalNote = 
          ((entry.googleSearchResult && typeof entry.googleSearchResult.note === 'number') ? entry.googleSearchResult.note : 0) +
          ((entry.GPTResearch && typeof entry.GPTResearch.note === 'number') ? entry.GPTResearch.note : 0);   
          
          entryDivTitle.style.color = getColorForTotalNote(totalNote);
          
          const subEntryDiv = document.createElement("div");
          subEntryDiv.className = "fact-check-list-element-subdiv";


          if (entry.googleSearchResult) {
            const iconDiv = document.createElement("div");
            iconDiv.className = "fact-check-list-element-subdiv-icon";

            const p = document.createElement("p");

            if (entry.googleSearchResult.note) {
              p.textContent = `${entry.googleSearchResult.note}/10`
              p.style.color = getColorForNote(entry.googleSearchResult.note);
            } else {
              p.textContent = `?`
            }
            
            const img = document.createElement("img");
            img.src = "assets/google_search_logo.png"; // Set the source of the image
            img.alt = "Google Search Icon"; // Set alternative text for accessibility
            img.width = 24; // Set width (optional)
            img.height = 24; // Set height (optional)

            // Append the image to the div
            iconDiv.appendChild(p);


            if (entry.googleSearchResult.source && entry.googleSearchResult.source.length > 0) {
              const a = document.createElement("a");
              a.href = entry.googleSearchResult.source;
              a.target = "_blank";

              a.appendChild(img);
              iconDiv.appendChild(a);
            } else {
              iconDiv.appendChild(img);
            }
            

            subEntryDiv.appendChild(iconDiv);
          } 

          if (entry.GPTResearch) {
            const iconDiv = document.createElement("div");
            iconDiv.className = "fact-check-list-element-subdiv-icon";

            const p = document.createElement("p");

            if (entry.GPTResearch.note) {
              p.textContent = `${entry.GPTResearch.note}/10`;
              p.style.color = getColorForNote(entry.GPTResearch.note);
            } else {
              p.textContent = `?`
            }

            const img = document.createElement("img");
            img.src = "assets/openai_logo.png"; // Set the source of the image
            img.alt = "Open AI Icon"; // Set alternative text for accessibility
            img.width = 24; // Set width (optional)
            img.height = 24; // Set height (optional)

            // Append the image to the div
            iconDiv.appendChild(p);

            if (entry.GPTResearch.source && entry.GPTResearch.source.length > 0) {
              const a = document.createElement("a");
              a.href = entry.GPTResearch.source;
              a.target = "_blank";

              a.appendChild(img);
              iconDiv.appendChild(a);
            } else {
              iconDiv.appendChild(img);
            }

            subEntryDiv.appendChild(iconDiv);
          } 

          
          

          entryDiv.appendChild(entryDivTitle);
          entryDiv.appendChild(subEntryDiv);

          listDiv.appendChild(entryDiv);
        }

        

      }
    }
  });
}


function getColorForTotalNote(note) {
  if (note <= 6) {
    return "rgb(255, 0, 0)"
  } else if (note <= 12) {
    return "rgb(255, 255, 0)"
  } else if (note <= 20) {
    return "rgb(0, 255, 0)"
  }
}

function getColorForNote(note) {
  if (note <= 3) {
    return "rgb(255, 0, 0)"
  } else if (note <= 6) {
    return "rgb(255, 255, 0)"
  } else if (note <= 10) {
    return "rgb(0, 255, 0)"
  }
}
