document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const triggerBtn = document.getElementById('trigger-btn');
    const aaPool = document.getElementById('aa-pool');
    const pathwaysContainer = document.querySelector('.pathways-container');
    const arrowToAA = document.getElementById('arrow-to-aa');
    const arrowToPathways = document.getElementById('arrow-to-pathways');
    const nodes = document.querySelectorAll('.node');
    const mainTooltip = document.getElementById('main-tooltip');
    const bodyElement = document.body;

    // For PC layout, explicitly get the new columns
    const diagramColumn = document.querySelector('.diagram-column');
    const panelsColumn = document.querySelector('.panels-column');

    // Mobile Pathway Selection
    const pathwaySelectButtons = document.querySelectorAll('.pathway-select-btn');
    const pathwayContentAreas = document.querySelectorAll('.pathway-content-area');

    // Panel Toggles (for controls and readouts accordions)
    const panelToggles = document.querySelectorAll('.panel-toggle');
    // const infoIcons = document.querySelectorAll('.info-icon'); // No longer needed

    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    if (isMobile) {
        bodyElement.classList.add('mobile');
    }

    const controls = {};
    const controlButtonIds = [
        'drug-nsaid', 'drug-cox2i', 'drug-aspirin', 'drug-csteroid', 'drug-loxi', 'drug-ltra',
        'drug-beta-blocker', 'drug-ace-inhibitor', 'drug-ccb', // New buttons
        'reset-btn'
    ];
    controlButtonIds.forEach(id => {
        const camelCaseId = id.replace(/-(\w)/g, (match, p1) => p1.toUpperCase());
        controls[camelCaseId] = document.getElementById(id);
    });

    const readouts = {};
    document.querySelectorAll('.readout-item').forEach(item => {
        const key = item.dataset.key;
        if (key) {
           readouts[key] = {
               item: item,
               status: item.querySelector('.readout-status'),
               bar: item.querySelector('.readout-bar')
           };
        } else {
            console.warn("Readout item missing data-key:", item);
        }
    });

    let cascadeTriggered = false;
    let currentDrug = 'none';
    let tooltipHideTimeout;
    const TOOLTIP_HIDE_DELAY = isMobile ? 1500 : 200;
    let activeTooltipNode = null;

   const baseExplanations = {
        none: {
            inflammationVasc: "No inflammatory stimulus active. <span class='tooltip-term' data-term-info='Blood vessels'>Vascular</span> tone is normal.",
            inflammationLeuk: "No significant <span class='tooltip-term' data-term-info='White blood cells involved in immunity'>leukocyte</span> recruitment or activation.",
            resolution: "No ongoing <span class='tooltip-term' data-term-info='The body\\'s response to injury or infection'>inflammation</span> to resolve.",
            cns: "Baseline <span class='tooltip-term' data-term-info='Central Nervous System (brain and spinal cord)'>CNS</span> activity; normal temperature and pain thresholds.",
            platelets: "Normal baseline <span class='tooltip-term' data-term-info='Small blood cells crucial for clotting'>platelet</span> activity.",
            bronchi: "Normal baseline <span class='tooltip-term' data-term-info='Airways in the lungs'>bronchial</span> tone.",
            cvTone: "Balanced baseline <span class='tooltip-term' data-term-info='Related to the heart and blood vessels'>cardiovascular</span> tone.",
            stomach: "Normal <span class='tooltip-term' data-term-info='Mechanisms that protect the stomach lining from acid and damage, often involving prostaglandins'>gastric protective mechanisms</span>.",
            kidney: "Normal baseline <span class='tooltip-term' data-term-info='Function of the kidneys in filtering blood and producing urine'>kidney function</span>.",
            uterus: "Baseline <span class='tooltip-term' data-term-info='Muscle tone of the uterus'>uterine tone</span>."
        },
        triggered: {
            inflammationVasc: "Stimulus causes release of <span class='tooltip-term' data-term-info='Widening of blood vessels'>vasodilating</span> <span class='tooltip-term' data-term-info='Prostaglandins, a class of eicosanoids'>PGs</span> (<span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span>, <span class='tooltip-term' data-term-info='Prostacyclin or PGI₂'>PGI₂</span>) & <span class='tooltip-term' data-term-info='Cysteinyl Leukotrienes (LTC₄, LTD₄, LTE₄)'>CysLTs</span>, increasing <span class='tooltip-term' data-term-info='How easily fluids/cells pass through vessel walls'>permeability</span>.",
            inflammationLeuk: "Stimulus causes <span class='tooltip-term' data-term-info='Leukotriene B₄, a potent chemoattractant'>LTB₄</span> release, a potent <span class='tooltip-term' data-term-info='A type of white blood cell'>neutrophil</span> <span class='tooltip-term' data-term-info='Substance attracting cells'>chemoattractant</span>.",
            resolution: "<span class='tooltip-term' data-term-info='Promoting inflammation'>Pro-inflammatory</span> signals initially dominate over <span class='tooltip-term' data-term-info='Promoting the resolution of inflammation'>pro-resolving</span> pathways (e.g., <span class='tooltip-term' data-term-info='Anti-inflammatory lipid mediators'>Lipoxins</span>).",
            cns: "Stimulus triggers <span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span> synthesis affecting <span class='tooltip-term' data-term-info='Brain region controlling temperature'>hypothalamus</span> (fever) and <span class='tooltip-term' data-term-info='Nerve endings that sense pain'>nerve endings</span> (pain).",
            platelets: "Stimulus may slightly alter <span class='tooltip-term' data-term-info='Platelet clumping'>platelet aggregation</span> balance between <span class='tooltip-term' data-term-info='Thromboxane A₂, pro-aggregatory'>TXA₂</span> & <span class='tooltip-term' data-term-info='Prostacyclin, anti-aggregatory'>PGI₂</span>.",
            bronchi: "Stimulus triggers <span class='tooltip-term' data-term-info='Cysteinyl Leukotrienes'>CysLT</span> release, causing <span class='tooltip-term' data-term-info='Narrowing of airways'>bronchoconstriction</span>.",
            cvTone: "Complex mix: Vasodilating <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>/<span class='tooltip-term' data-term-info='Epoxyeicosatrienoic acids, generally vasodilatory'>EETs</span> vs Vasoconstricting <span class='tooltip-term' data-term-info='Thromboxane A₂'>TXA₂</span>/<span class='tooltip-term' data-term-info='20-Hydroxyeicosatetraenoic acid, often vasoconstricting'>20-HETE</span>.",
            stomach: "Baseline <span class='tooltip-term' data-term-info='Stomach lining protection'>gastric protection</span> via <span class='tooltip-term' data-term-info='Cyclooxygenase-1'>COX-1</span> derived <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> may be initially overwhelmed or later affected.",
            kidney: "Baseline function maintained, but changes in <span class='tooltip-term' data-term-info='Prostaglandins, important for renal blood flow and function'>renal prostanoids</span> begin.",
            uterus: "Stimulus triggers <span class='tooltip-term' data-term-info='Prostaglandins'>PG</span> release (<span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span>/<span class='tooltip-term' data-term-info='Prostaglandin F₂ alpha, causes uterine contraction'>PGF₂α</span>) increasing tone/<span class='tooltip-term' data-term-info='Muscle tightening'>contractions</span>."
        }
   };

    function resetSimulation() {
        aaPool.style.display = 'none';
        pathwaysContainer.style.display = 'none'; // Keep this for desktop, mobile handles individual areas
        arrowToAA.style.display = 'none';
        arrowToPathways.style.display = 'none';
        triggerBtn.disabled = false;
        cascadeTriggered = false;
        currentDrug = 'none';
        hideMainTooltip(true);

        nodes.forEach(node => {
            node.classList.remove('inhibited');
            node.classList.remove('mobile-tooltip-active');
        });
        activeTooltipNode = null;

        if (isMobile) {
            mainTooltip.querySelectorAll('.tooltip-term.active-nested-tooltip').forEach(activeTerm => {
                activeTerm.classList.remove('active-nested-tooltip');
            });
            // Reset pathway selection and panel accordions for mobile
            pathwaySelectButtons.forEach((btn, index) => {
                btn.classList.toggle('active', index === 0); // Make first pathway (COX) active
            });
            pathwayContentAreas.forEach((area, index) => {
                area.classList.toggle('active-pathway-area', index === 0);
            });
            // Ensure panels are no longer closed by default on mobile (content always visible)
            /* panelToggles.forEach(toggle => {
                const content = toggle.nextElementSibling;
                if (content && content.classList.contains('panel-content')) {
                    content.classList.remove('active'); // Should be visible by default now
                    toggle.classList.remove('active');
                }
            }); */
        }


        for (const key in readouts) {
            const isBalanced = key === 'cvTone';
            const baseStatus = isBalanced ? 'status-balanced' : 'status-normal';
            const baseText = isBalanced ? 'Balanced' : 'Normal';
            updateReadoutVisuals(readouts[key], baseText, baseStatus, baseExplanations.none[key] || "Baseline state.");
        }
    }

    function triggerCascade() {
        if (!cascadeTriggered) {
            arrowToAA.style.display = 'block';
            aaPool.style.display = 'block';
            arrowToPathways.style.display = 'block';

            // Ensure the main pathways container is visible on trigger for both desktop and mobile
            pathwaysContainer.style.display = 'block'; 

            if (isMobile) { // Mobile shows the selected pathway area
                 const activeSelector = document.querySelector('.pathway-select-btn.active');
                 if (activeSelector) {
                    const pathwayId = activeSelector.dataset.pathway;
                    const targetArea = document.querySelector(`.pathway-content-area[data-pathway-id="${pathwayId}"]`);
                    if (targetArea) targetArea.classList.add('active-pathway-area');
                 } else { // Fallback if no active button (should be one by default)
                    document.querySelector('.pathway-content-area[data-pathway-id="cox"]').classList.add('active-pathway-area');
                 }
            } // Desktop: pathwaysContainer.style.display = 'block' above handles showing the container with its flex items.

            triggerBtn.disabled = true;
            cascadeTriggered = true;
            currentDrug = 'triggered';
            resetReadoutsToTriggeredState(true);
        }
    }

    function resetReadoutsToTriggeredState(isInitialTrigger = false) {
         if (!cascadeTriggered && !isInitialTrigger) return;
        for (const key in readouts) {
            const readoutConfig = getTriggeredStateConfig(key);
            updateReadoutVisuals(readouts[key], readoutConfig.text, readoutConfig.statusClass, baseExplanations.triggered[key] || "Triggered state.");
        }
    }

    function getTriggeredStateConfig(key) {
        switch(key) {
           case 'inflammationVasc': case 'inflammationLeuk': case 'cns': case 'uterus': return { text: 'Increased', statusClass: 'status-increased' };
           case 'resolution': return { text: 'Suppressed', statusClass: 'status-suppressed' };
           case 'platelets': case 'stomach': case 'kidney': return { text: 'Normal', statusClass: 'status-normal' };
           case 'bronchi': return { text: 'Constricted', statusClass: 'status-constricted' };
           case 'cvTone': return { text: 'Mixed', statusClass: 'status-mixed' };
           default: return { text: 'Normal', statusClass: 'status-normal' };
        }
    }

   function applyDrugEffect(drugKey, inhibitedNodesIds = [], blockedMediatorsIds = [], readoutChanges = {}) {
       if (!cascadeTriggered) {
           alert("Please trigger the cascade first by applying stimulus!");
           return;
       }
       currentDrug = drugKey;
       hideMainTooltip(true);

       nodes.forEach(node => node.classList.remove('inhibited'));
       resetReadoutsToTriggeredState(); 

       inhibitedNodesIds.forEach(id => {
           const node = document.getElementById(id);
           if (node) node.classList.add('inhibited');
       });
        blockedMediatorsIds.forEach(id => {
           const node = document.getElementById(id);
           if (node) node.classList.add('inhibited');
       });

       for (const readoutKey in readoutChanges) {
           if (readouts[readoutKey]) {
               updateReadoutVisuals(
                   readouts[readoutKey],
                   readoutChanges[readoutKey].text,
                   readoutChanges[readoutKey].statusClass,
                   readoutChanges[readoutKey].explanation
               );
           }
       }
        for (const key in readouts) {
            if (!readoutChanges[key]) { 
                 const currentExplanation = readouts[key].item.getAttribute('data-explanation');
                 if (!currentExplanation || currentExplanation === (baseExplanations.none[key] || "Baseline state.")) {
                    updateReadoutVisuals(
                        readouts[key],
                        readouts[key].status.textContent, 
                        readouts[key].item.className.split(' ').find(c => c.startsWith('status-')) || getTriggeredStateConfig(key).statusClass,
                        baseExplanations.triggered[key] || "Triggered state effect."
                    );
                 }
            }
        }
   }

   function updateReadoutVisuals(readoutElements, statusText, statusClass, explanationText) {
        if (!readoutElements || !readoutElements.status || !readoutElements.bar || !readoutElements.item) return;
        readoutElements.status.textContent = statusText;
        readoutElements.item.className = `readout-item ${statusClass}`; // Ensure base class is present
        readoutElements.status.className = `readout-status ${statusClass}`; // Ensure base class is present
        readoutElements.item.setAttribute('data-explanation', explanationText || "No specific explanation available.");
   }


    function showMainTooltip(nodeElement, event, nameOverride, infoOverride) {
        // Check if it's a drug button and if so, use its specific data attribute
        const drugInfo = nodeElement.dataset.drugInfo;
        const nodeName = nodeElement.querySelector('.desktop-text')?.textContent.trim() || nodeElement.textContent.trim();

        if (nodeElement.classList.contains('inhibited') && !nodeElement.classList.contains('info-icon')) return;

        if (isMobile && activeTooltipNode && activeTooltipNode !== nodeElement) {
            hideMainTooltip(true);
            if(activeTooltipNode) activeTooltipNode.classList.remove('mobile-tooltip-active');
        }
        clearTimeout(tooltipHideTimeout);

        let name = nameOverride;
        let info = infoOverride;

        if (drugInfo) { // If it's a drug button with data-drug-info
            name = nodeName || 'Drug Information';
            info = drugInfo;
        } else if (nodeElement.classList.contains('info-icon')) {
            const readoutItem = nodeElement.closest('.readout-item');
            name = readoutItem?.querySelector('.readout-label')?.textContent.trim() || 'Details';
            info = readoutItem?.dataset.explanation || 'No details available.';
        } else {
             name = nameOverride || nodeElement.dataset.name || nodeElement.textContent.trim() || 'N/A';
             info = infoOverride || nodeElement.dataset.info || nodeElement.dataset.termInfo || nodeElement.dataset.explanation || 'No details available.';
        }

        mainTooltip.innerHTML = `<h3>${name}</h3><div>${info}</div>`; // Use div for info for better styling if needed

        mainTooltip.style.visibility = 'hidden'; mainTooltip.style.opacity = '0'; mainTooltip.style.left = '-9999px';
        // Force reflow to get correct dimensions
        mainTooltip.offsetHeight; mainTooltip.offsetWidth;


        const tooltipCurrentWidth = mainTooltip.offsetWidth;
        const tooltipCurrentHeight = mainTooltip.offsetHeight;

        const nodeRect = nodeElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x, y;

        if (isMobile) {
            if (nodeElement.classList.contains('info-icon') || nodeElement.tagName === 'BUTTON') { // Treat buttons similarly to info-icons for mobile positioning
                 x = nodeRect.left + (nodeRect.width / 2) - (tooltipCurrentWidth / 2);
                 y = nodeRect.top - tooltipCurrentHeight - 10; 
                 if (y < 10 || (nodeElement.tagName === 'BUTTON' && y < (nodeRect.top - 50))) { // If not enough space above, or it's a button (prefer below for buttons)
                     y = nodeRect.bottom + 10;
                 }
            } else { // Original logic for diagram nodes
                x = nodeRect.left + (nodeRect.width / 2) - (tooltipCurrentWidth / 2);
                y = nodeRect.bottom + 10; 
                if (y + tooltipCurrentHeight > viewportHeight - 10) { y = nodeRect.top - tooltipCurrentHeight - 10; }
            }

            if (y < 10) y = 10;
            if (x < 10) x = 10;
            if (x + tooltipCurrentWidth > viewportWidth - 10) { x = viewportWidth - tooltipCurrentWidth - 10; }
            
            x += window.scrollX; 
            y += window.scrollY;

        } else { // Desktop logic
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            x = event.pageX + 15;
            y = event.pageY + 15;
            if (x + tooltipCurrentWidth > scrollX + viewportWidth - 10) { x = scrollX + viewportWidth - tooltipCurrentWidth - 10; }
            if (x < scrollX + 10) { x = scrollX + 10; }
            if (y + tooltipCurrentHeight > scrollY + viewportHeight - 10) { y = scrollY + viewportHeight - tooltipCurrentHeight - 10; }
            if (y < scrollY + 10) { y = scrollY + 10; }
        }

        mainTooltip.style.left = `${x}px`;
        mainTooltip.style.top = `${y}px`;
        mainTooltip.style.visibility = 'visible';
        mainTooltip.style.opacity = '1';

        if (isMobile) {
            nodeElement.classList.add('mobile-tooltip-active');
            activeTooltipNode = nodeElement;
        }
    }

    function hideMainTooltip(force = false) {
        if (force) {
            clearTimeout(tooltipHideTimeout);
        }
        const delay = (force && !isMobile) ? 50 : 0;
        tooltipHideTimeout = setTimeout(() => {
            mainTooltip.style.visibility = 'hidden';
            mainTooltip.style.opacity = '0';
            mainTooltip.style.left = '-9999px';
            if (activeTooltipNode) {
                activeTooltipNode.classList.remove('mobile-tooltip-active');
                activeTooltipNode = null;
                mainTooltip.querySelectorAll('.tooltip-term.active-nested-tooltip').forEach(activeTerm => {
                    activeTerm.classList.remove('active-nested-tooltip');
                });
            }
        }, force ? delay : TOOLTIP_HIDE_DELAY);
    }

    nodes.forEach(node => {
        if (isMobile) {
            node.addEventListener('click', (event) => {
                event.stopPropagation();
                if (activeTooltipNode === node && mainTooltip.style.visibility === 'visible') {
                    hideMainTooltip(true);
                } else {
                    showMainTooltip(node, event);
                }
            });
        } else {
            node.addEventListener('mouseenter', (event) => showMainTooltip(node, event));
            node.addEventListener('mouseleave', () => hideMainTooltip());
        }
    });

    document.querySelectorAll('.tooltip-term:not(#main-tooltip .tooltip-term)').forEach(term => {
        const termName = term.textContent.trim();
        const termInfo = term.dataset.termInfo;
        if (isMobile) {
            term.addEventListener('click', (event) => {
                event.stopPropagation();
                if (activeTooltipNode === term && mainTooltip.style.visibility === 'visible') { 
                    hideMainTooltip(true); 
                } else { 
                    showMainTooltip(term, event, termName, termInfo); 
                }
            });
        } else {
            term.addEventListener('mouseenter', (event) => showMainTooltip(term, event, termName, termInfo));
            term.addEventListener('mouseleave', () => hideMainTooltip());
        }
    });

    // Event Listeners for Readout Items (Tooltip on hover for desktop, tap for mobile)
    document.querySelectorAll('.readout-item').forEach(item => {
            const itemName = item.querySelector('.readout-label')?.textContent.trim() || 'Readout Item';
        // For desktop, itemInfo is fetched dynamically in mouseenter as it can change.

        if (isMobile) {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                if (activeTooltipNode === item && mainTooltip.style.visibility === 'visible') {
                    hideMainTooltip(true);
                } else {
                    // Fetch current explanation for mobile tap
                    const currentItemInfo = item.dataset.explanation;
                    showMainTooltip(item, event, itemName, currentItemInfo);
                }
            });
        } else { // Desktop hover
            item.addEventListener('mouseenter', (event) => {
                const currentItemInfo = item.dataset.explanation; // Get latest explanation
                showMainTooltip(item, event, itemName, currentItemInfo);
            });
            item.addEventListener('mouseleave', () => hideMainTooltip());
        }
    });
    
    // General document click listener for hiding tooltips
    document.addEventListener('click', (event) => {
        if (mainTooltip.style.visibility === 'visible') {
            const isClickOnActiveElement = activeTooltipNode && activeTooltipNode.contains(event.target);
            const isClickInsideTooltip = mainTooltip.contains(event.target);
            if (!isClickOnActiveElement && !isClickInsideTooltip) {
                hideMainTooltip(true);
            }
        }
    });

    // mainTooltip click for nested terms (already present and assumed correct)
    mainTooltip.addEventListener('click', function(event) {
        // ... existing nested tooltip logic ...
        const term = event.target.closest('.tooltip-term');
        if (term && this.contains(term)) { 
            event.stopPropagation();
            const wasActive = term.classList.contains('active-nested-tooltip');
            this.querySelectorAll('.tooltip-term.active-nested-tooltip').forEach(activeTerm => {
                if (activeTerm !== term) { 
                activeTerm.classList.remove('active-nested-tooltip');
                }
            });
            if (wasActive) {
                term.classList.remove('active-nested-tooltip');
            } else {
                term.classList.add('active-nested-tooltip');
            }
        }
    });
    
    // ... (Pathway Selection Logic, Panel Accordion Logic - if any remains relevant) ...

    triggerBtn.addEventListener('click', triggerCascade);
    controls.resetBtn.addEventListener('click', resetSimulation);

    // Setup for Drug Buttons (Action + Tooltip Logic)
    for (const drugKey in drugEffects) {
        // Construct buttonIdCamel correctly as in the original script
        let buttonIdCamel = `drug${drugKey.charAt(0).toUpperCase() + drugKey.slice(1)}`;
        if (drugKey === "cox2i") buttonIdCamel = "drugCox2i"; 
        else if (drugKey === "csteroid") buttonIdCamel = "drugCsteroid";
        else if (drugKey === "loxi") buttonIdCamel = "drugLoxi";
        else if (drugKey === "ltra") buttonIdCamel = "drugLtra";
        else if (drugKey === "nsaid") buttonIdCamel = "drugNsaid";
        else if (drugKey === "aspirin") buttonIdCamel = "drugAspirin";
        else if (drugKey === "betaBlocker") buttonIdCamel = "drugBetaBlocker";
        else if (drugKey === "aceInhibitor") buttonIdCamel = "drugAceInhibitor";
        else if (drugKey === "ccb") buttonIdCamel = "drugCcb";

        const button = controls[buttonIdCamel];

        if (button) {
            button.longPressDidOccur = false; // Initialize flag on the button element
            button.longPressTimer = null;    // Initialize timer reference

            if (isMobile) {
                button.addEventListener('touchstart', (e) => {
                    button.longPressDidOccur = false; // Reset on new touch
                    clearTimeout(button.longPressTimer);

                    const buttonText = button.querySelector('.mobile-text')?.textContent.trim() || button.querySelector('.desktop-text')?.textContent.trim() || button.textContent.trim();
                    const drugInfoText = button.dataset.drugInfo;

                    button.longPressTimer = setTimeout(() => {
                        button.longPressDidOccur = true;
                        showMainTooltip(button, e, buttonText, drugInfoText); 
                    }, 500); // 500ms for long press
                });

                button.addEventListener('touchend', () => {
                    clearTimeout(button.longPressTimer);
                    // longPressDidOccur flag remains true if timer fired, until click handler resets it.
                });

                button.addEventListener('touchmove', () => {
                    clearTimeout(button.longPressTimer); // Cancel long press if finger moves
                    // Optional: button.longPressDidOccur = false; // if dragging should not count as precursor to long-press-click
                });
            } else { // Desktop: Tooltip on hover
                button.addEventListener('mouseenter', (event) => {
                    const buttonText = button.querySelector('.desktop-text')?.textContent.trim() || button.textContent.trim();
                    const drugInfoText = button.dataset.drugInfo;
                    showMainTooltip(button, event, buttonText, drugInfoText);
                });
                button.addEventListener('mouseleave', () => {
                    hideMainTooltip();
                });
            }

            // Click listener for APPLYING DRUG EFFECT
            button.addEventListener('click', (event) => {
                if (isMobile) {
                    if (button.longPressDidOccur) { 
                        event.preventDefault();    
                        button.longPressDidOccur = false; // Reset flag
                        // Tooltip is already shown by long press. A tap on button itself while tooltip is active is handled next.
                        // If this click event is on the button and its tooltip is active, this tap should ideally do nothing more or hide it.
                        // The `activeTooltipNode` check below might handle hiding.
                        return; 
                    }

                    // If it was a short tap, AND a tooltip for THIS button is ALREADY visible (e.g. from a very recent long press)
                    // This tap should hide the tooltip and not apply the drug.
                    if (activeTooltipNode === button && mainTooltip.style.visibility === 'visible') {
                         hideMainTooltip(true);
                         event.preventDefault(); 
                         button.longPressDidOccur = false; // Ensure flag is reset
                         return;
                    }
                }
                
                // If not mobile, or if mobile and it was a clear short tap (no long press, no active tooltip for this button to close),
                // then apply the drug effect.
                applyDrugEffect(
                drugKey,
                drugEffects[drugKey].inhibited,
                drugEffects[drugKey].blocked,
                drugEffects[drugKey].readouts
                );
                button.longPressDidOccur = false; // Ensure flag is reset after any click processing
            });
        } else {
            console.warn("Button not found for drug:", drugKey, "Expected ID in controls:", buttonIdCamel);
        }
    }

    // ... (Initial setup, resetSimulation call, etc.) ...
    resetSimulation();
}); // End DOMContentLoaded