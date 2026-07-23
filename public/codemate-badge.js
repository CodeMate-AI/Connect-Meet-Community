(() => {
    // Check if running inside an iframe (like Sandpack preview)
    const isIframe = window.self !== window.top;

    if (isIframe) {
        console.log("[Codemate Badge] Running inside an iframe (e.g., Sandpack). Badge will not be added.");
        return; // Stop script execution if inside an iframe
    }

    // If not in an iframe and not on localhost, proceed with adding the badge
    console.log("[Codemate Badge] Script execution started (not in an iframe or localhost).");

    // Add Google Fonts (Inter)
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(linkElement);
    console.log("[Codemate Badge] Added Inter font from Google Fonts.");

    // Function to inject the badge
    function addCodemateBadge() {
        console.log("[Codemate Badge] addCodemateBadge function invoked.");

        // Prevent adding multiple badges if script runs twice
        if (document.getElementById("codemate-badge")) {
            console.log("[Codemate Badge] Badge element already found in DOM. Aborting.");
            return;
        }

        // Check if dark mode is active
        const isDarkMode = document.body && document.body.classList.contains('dark');
        console.log(`[Codemate Badge] Dark mode detected: ${isDarkMode}`);

        // 1. Create the badge element (an anchor link)
        console.log("[Codemate Badge] Creating badge anchor element...");
        const badge = document.createElement("a");
        badge.id = "codemate-badge";
        badge.href = "http://codemate.ai/"; // <<<--- IMPORTANT: Use your actual Codemate website URL
        badge.target = "_blank";
        badge.rel = "noopener noreferrer";
        console.log("[Codemate Badge] Badge element created successfully.");

        // 2. Create the container for "Made with" text and logo
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "8px"; // Space between text and logo

        // 3. Create the "Made with" text element
        const madeWithText = document.createElement("span");
        madeWithText.textContent = "Made with";
        madeWithText.style.color = isDarkMode ? "#E0E0E0" : "#333333"; // Lighter text for dark mode
        madeWithText.style.fontSize = "12px";
        madeWithText.style.fontFamily = "'Inter', sans-serif";
        madeWithText.style.fontWeight = "500"; // Medium weight
        madeWithText.style.letterSpacing = "-0.01em"; // Slightly tighter letter spacing for Inter

        // 4. Create the image element for the logo
        console.log("[Codemate Badge] Creating logo image element...");
        const logoImage = document.createElement("img");
        // Using absolute URLs for logos as relative paths might break in mutation observer
        logoImage.src = isDarkMode ? "http://drive.codemate.ai/codemate-logo-dark.png" : "http://drive.codemate.ai/codemate-logo.png";
        logoImage.alt = "Codemate.ai";
        logoImage.style.height = "15px"; // Adjust height as needed
        logoImage.style.width = "auto";
        logoImage.style.display = "block";

        // Add the text and logo to the container
        container.appendChild(madeWithText);
        container.appendChild(logoImage);

        // Add the container to the badge
        badge.appendChild(container);

        // 5. Style the badge using inline styles with brand colors and pill design
        console.log("[Codemate Badge] Applying inline styles...");
        badge.style.position = "fixed";
        badge.style.left = "15px"; // Position from left
        badge.style.bottom = "15px";
        badge.style.padding = "8px 12px"; // Padding for pill shape
        badge.style.backgroundColor = isDarkMode ? "#1F1F1F" : "#FFFFFF"; // Dark background for dark mode
        badge.style.display = "flex";
        badge.style.alignItems = "center";
        badge.style.justifyContent = "center";
        badge.style.textDecoration = "none";
        badge.style.borderRadius = "50px"; // Pill shape
        badge.style.zIndex = "99999";
        badge.style.boxShadow = isDarkMode ? "0 2px 5px rgba(0,0,0,0.5)" : "0 2px 5px rgba(0,0,0,0.2)"; // Darker shadow for dark mode
        badge.style.transition = "all 0.3s ease"; // Transition for all properties
        badge.style.border = isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)"; // Adjusted border for dark mode

        // Optional: Add hover effects for a more interactive feel
        badge.onmouseover = () => {
            badge.style.transform = "translateY(-2px)"; // Slight lift effect
            badge.style.boxShadow = isDarkMode ? "0 4px 8px rgba(0,0,0,0.6)" : "0 4px 8px rgba(0,0,0,0.2)"; // Enhanced shadow on hover
        };
        badge.onmouseout = () => {
            badge.style.transform = "translateY(0)";
            badge.style.boxShadow = isDarkMode ? "0 2px 5px rgba(0,0,0,0.5)" : "0 2px 5px rgba(0,0,0,0.2)";
        };
        console.log("[Codemate Badge] Inline styles applied.");

        // 6. Append the badge to the body of the HTML document
        if (document.body) {
            console.log("[Codemate Badge] document.body exists. Appending badge directly.");
            document.body.appendChild(badge);
            console.log("[Codemate Badge] Badge successfully appended to body.");
            // Start observing only AFTER appending
            startObserver();
        } else {
            console.log("[Codemate Badge] document.body not found. Adding DOMContentLoaded listener.");
            document.addEventListener("DOMContentLoaded", () => {
                console.log("[Codemate Badge] DOMContentLoaded event fired.");
                if (!document.getElementById("codemate-badge")) {
                    console.log("[Codemate Badge] Appending badge inside DOMContentLoaded listener.");
                    document.body.appendChild(badge);
                    console.log("[Codemate Badge] Badge successfully appended via listener.");
                    // Start observing only AFTER appending
                    startObserver();
                } else {
                    console.log("[Codemate Badge] Badge element already exists when DOMContentLoaded listener fired.");
                }
            });
        }

        // 7. Function to start the MutationObserver (only called if badge is added)
        function startObserver() {
            if (!document.body) return; // Safety check

            const bodyObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const badgeElement = document.getElementById("codemate-badge"); // Get fresh reference
                        const containerElement = badgeElement?.querySelector("div"); // Find container inside
                        const textElement = containerElement?.querySelector("span"); // Find span inside container
                        const imgElement = containerElement?.querySelector("img"); // Find image inside container

                        // Check if elements exist before trying to style them
                        if (!badgeElement || !containerElement || !textElement || !imgElement) {
                            console.warn("[Codemate Badge] Observer triggered, but badge elements not found.");
                            return;
                        }

                        const isDarkModeNow = document.body.classList.contains('dark');
                        console.log(`[Codemate Badge] Dark mode changed to: ${isDarkModeNow}`);

                        // Update badge colors and logo for new theme
                        badgeElement.style.backgroundColor = isDarkModeNow ? "#1F1F1F" : "#FFFFFF";
                        textElement.style.color = isDarkModeNow ? "#E0E0E0" : "#333333";
                        // Use the absolute URLs here too
                        imgElement.src = isDarkModeNow ? "http://drive.codemate.ai/codemate-logo-dark.png" : "http://drive.codemate.ai/codemate-logo.png";
                        badgeElement.style.boxShadow = isDarkModeNow ? "0 2px 5px rgba(0,0,0,0.5)" : "0 2px 5px rgba(0,0,0,0.2)";
                        badgeElement.style.border = isDarkModeNow ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)";

                        // Update hover effects (re-assign functions to capture new isDarkModeNow value)
                        badgeElement.onmouseover = () => {
                            badgeElement.style.transform = "translateY(-2px)";
                            badgeElement.style.boxShadow = isDarkModeNow ? "0 4px 8px rgba(0,0,0,0.6)" : "0 4px 8px rgba(0,0,0,0.2)";
                        };
                        badgeElement.onmouseout = () => {
                            badgeElement.style.transform = "translateY(0)";
                            badgeElement.style.boxShadow = isDarkModeNow ? "0 2px 5px rgba(0,0,0,0.5)" : "0 2px 5px rgba(0,0,0,0.2)";
                        };
                    }
                });
            });

            // Start observing document.body for class changes
            bodyObserver.observe(document.body, { attributes: true });
            console.log("[Codemate Badge] MutationObserver started for body class changes.");
        }
    }

    // Run the function to add the badge (only if not in an iframe or localhost)
    addCodemateBadge();

})();