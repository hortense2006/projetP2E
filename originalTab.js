console.log("originalTab.js loaded !");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("message received", message)




        if (message.type === "tabExtractArticleAndMetadata") {
            
            console.log("TAB EXTRACTING ARTICLE...");
            const targetElement = document.querySelector("article, main, article-main, texte-article");
            const mainImage =
                document.querySelector("meta[property='og:image']")?.content ||
                document.querySelector("meta[name='twitter:image']")?.content ||
                document.querySelector("article img")?.src ||
                document.querySelector("main img")?.src ||
                document.querySelector(".post img, .entry-content img, .wp-post-image")?.src ||
                document.querySelector("img")?.src ||
                null;

            console.log("MAIN IMAGE DETECTED:", mainImage);

            let rawPageText;

            if (targetElement) {
                // Extraire uniquement le texte de <article> ou <main>
                rawPageText = targetElement.textContent.trim();
            } else {
                // Sinon : Texte brut de toute la page
                rawPageText = document.body.textContent.trim();
            }
            
            let webPageText;
            
            if (targetElement) {
                // Extraire uniquement le texte de <article> ou <main>
                webPageText = targetElement.textContent.trim();
            } else {
                // Sinon : Texte brut de toute la page
                webPageText = document.body.textContent.trim();
            }

            //originalTab.js => background.js
            chrome.runtime.sendMessage({
                type: "bgExtractArticleAndMetadataFromPage",
                rawPageText: rawPageText,
                webPageText: webPageText,
                mainImage: mainImage
            });
        } else if (message.type === "tabSendArticleAndMetadata") {
            console.log("TAB EXTRACTED ARTICLE!!!", message);

            const url = new URL(window.location.href);
            const domain = url.hostname;

            chrome.runtime.sendMessage({
                type: "sendArticleAndMetadataToPopup",
                articleText: message.articleText,
                articleMetadata: message.articleMetadata,
                hiveAnalysis: message.hiveAnalysis,
                mainImage: message.mainImage,
                tabDomain: domain,
                error: message.error || null
            });

        }
        else if (message.type === "tabSummarize") {

            const summaryLength = message.summaryLength

            askBackgroundSummarize(summaryLength)

        } else if (message.type === "tabSendNewMenuLoadingText") {
            chrome.runtime.sendMessage({
                type: "sendNewMenuLoadingTextToPopup",
                loadingText: message.loadingText
            });

        }
});


//SUMMARY
function askBackgroundSummarize(articleDirtyText, summaryLength) {
    //originalTab.js => background.js
    chrome.runtime.sendMessage({
        type: "backgroundSummarize",
        articleDirtyText
    }, (response) => {
        if (response.summary) {
            console.log("Summary:", response.summary);
        } else {
            console.error("Error:", response.error);
        }
    });
}
