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
        readoutElements.item.className = readoutElements.item.className.split(' ').filter(cls => !cls.startsWith('status-')).join(' ') + ' ' + statusClass;
        readoutElements.status.className = readoutElements.status.className.split(' ').filter(cls => !cls.startsWith('status-')).join(' ') + ' ' + statusClass;
        readoutElements.item.setAttribute('data-explanation', explanationText || "No specific explanation available.");
   }


    function showMainTooltip(nodeElement, event, nameOverride, infoOverride) {
        if (nodeElement.classList.contains('inhibited') && !nodeElement.classList.contains('info-icon')) return;

        if (isMobile && activeTooltipNode && activeTooltipNode !== nodeElement) {
            hideMainTooltip(true);
            if(activeTooltipNode) activeTooltipNode.classList.remove('mobile-tooltip-active');
        }
        clearTimeout(tooltipHideTimeout);

        let name, info;

        if (nodeElement.classList.contains('info-icon')) {
            const readoutItem = nodeElement.closest('.readout-item');
            name = readoutItem?.querySelector('.readout-label')?.textContent.trim() || 'Details';
            info = readoutItem?.dataset.explanation || 'No details available.';
        } else if (nodeElement.dataset.drugInfo) { // Check for drug buttons first
            name = nameOverride || nodeElement.title || 'Drug Details'; // Use the button's existing title attribute
            info = infoOverride || nodeElement.dataset.drugInfo;
        } else { // Existing logic for other nodes and terms
             name = nameOverride || nodeElement.dataset.name || nodeElement.textContent.trim() || 'N/A';
             info = infoOverride || nodeElement.dataset.info || nodeElement.dataset.termInfo || nodeElement.dataset.explanation || 'No details available.';
        }

        mainTooltip.innerHTML = `<h3>${name}</h3><p>${info}</p>`;

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
            // For info icons, position relative to the icon itself.
            // For other nodes, try to center above/below.
            if (nodeElement.classList.contains('info-icon')) {
                 x = nodeRect.left + (nodeRect.width / 2) - (tooltipCurrentWidth / 2);
                 y = nodeRect.top - tooltipCurrentHeight - 10; // Position above icon
                 if (y < 10) { // If not enough space above, try below
                     y = nodeRect.bottom + 10;
                 }
            } else {
                x = nodeRect.left + (nodeRect.width / 2) - (tooltipCurrentWidth / 2);
                y = nodeRect.bottom + 10; // Default below node
                if (y + tooltipCurrentHeight > viewportHeight - 10) { y = nodeRect.top - tooltipCurrentHeight - 10; }
            }

            if (y < 10) y = 10;
            if (x < 10) x = 10;
            if (x + tooltipCurrentWidth > viewportWidth - 10) { x = viewportWidth - tooltipCurrentWidth - 10; }
            
            // Convert to page coordinates if scrolling is involved (though we aim for less)
            x += window.scrollX; 
            y += window.scrollY;

        } else { // Desktop logic remains
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
                if (activeTooltipNode === term && mainTooltip.style.visibility === 'visible') { hideMainTooltip(true); }
                else { showMainTooltip(term, event, termName, termInfo); }
            });
        } else {
            term.addEventListener('mouseenter', (event) => showMainTooltip(term, event, termName, termInfo));
            term.addEventListener('mouseleave', () => hideMainTooltip());
        }
    });

    // Desktop: Hover on readout items still works. Mobile: Click on info-icon handled below.
    document.querySelectorAll('.readout-item').forEach(item => {
        if (!isMobile) { // Desktop hover for entire readout item
            const itemName = item.querySelector('.readout-label')?.textContent.trim() || 'Readout Item';
            item.addEventListener('mouseenter', (event) => {
                const itemInfo = item.dataset.explanation;
                showMainTooltip(item, event, itemName, itemInfo);
            });
            item.addEventListener('mouseleave', () => hideMainTooltip());
        }
    });
    
    // Info icon click for mobile readouts
    /* infoIcons.forEach(icon => {
        icon.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering other clicks like readout-item if nested
            if (activeTooltipNode === icon && mainTooltip.style.visibility === 'visible') {
                hideMainTooltip(true);
            } else {
                // showMainTooltip will now handle .info-icon class to get correct name/info
                showMainTooltip(icon, event);
            }
        });
    }); */


    if (!isMobile) {
        mainTooltip.addEventListener('mouseenter', () => clearTimeout(tooltipHideTimeout));
        mainTooltip.addEventListener('mouseleave', () => hideMainTooltip());
    }

    document.addEventListener('click', (event) => {
        if (mainTooltip.style.visibility === 'visible') {
            const isClickInsideNode = activeTooltipNode && activeTooltipNode.contains(event.target);
            const isClickInsideTooltip = mainTooltip.contains(event.target);
            if (!isClickInsideNode && !isClickInsideTooltip) {
                hideMainTooltip(true);
            }
        }
    });

    mainTooltip.addEventListener('click', function(event) {
        const term = event.target.closest('.tooltip-term');
        if (term) {
            event.stopPropagation();
            const wasActive = term.classList.contains('active-nested-tooltip');
            this.querySelectorAll('.tooltip-term.active-nested-tooltip').forEach(activeTerm => {
                activeTerm.classList.remove('active-nested-tooltip');
            });
            if (!wasActive) {
                term.classList.add('active-nested-tooltip');
            }
        }
    });
    
    // Mobile Pathway Selection Logic
    pathwaySelectButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!cascadeTriggered && button.dataset.pathway !== 'cox') { // Allow COX to be default before trigger
                 // Optionally alert user or just don't switch if cascade not triggered
                 // alert("Trigger the cascade to view other pathways.");
                 // return;
            }

            // Remove active class from all buttons and areas
            pathwaySelectButtons.forEach(btn => btn.classList.remove('active'));
            pathwayContentAreas.forEach(area => area.classList.remove('active-pathway-area'));

            // Add active class to the clicked button and corresponding area
            button.classList.add('active');
            const pathwayId = button.dataset.pathway;
            const targetArea = document.querySelector(`.pathway-content-area[data-pathway-id="${pathwayId}"]`);
            if (targetArea) {
                targetArea.classList.add('active-pathway-area');
            }
        });
    });

    // Panel Accordion Logic (for controls and readouts on mobile)
    /* panelToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            if (!isMobile) return; // This accordion behavior is primarily for mobile

            const content = toggle.nextElementSibling;
            if (content && content.classList.contains('panel-content')) {
                const isActive = content.classList.contains('active');
                
                // Optional: Close other panel accordions if you want only one open at a time
                // panelToggles.forEach(otherToggle => {
                //     const otherContent = otherToggle.nextElementSibling;
                //     if (otherContent !== content && otherContent.classList.contains('active')) {
                //         otherContent.classList.remove('active');
                //         otherToggle.classList.remove('active');
                //     }
                // });

                content.classList.toggle('active');
                toggle.classList.toggle('active');
            }
        });
    }); */

    const drugEffects = {
        nsaid: {
            inhibited: ['cox1', 'cox2'], blocked: ['pgh2', 'pge2', 'pgd2', 'pgi2', 'txa2'],
            readouts: {
                inflammationVasc: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Cyclooxygenase enzymes 1 and 2'>COX-1/2</span>, reducing <span class='tooltip-term' data-term-info='Widening of blood vessels'>vasodilatory</span> <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> (<span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span>, <span class='tooltip-term' data-term-info='Prostacyclin or PGI₂'>PGI₂</span>)." },
                inflammationLeuk: { text: 'Increased', statusClass: 'status-increased', explanation: "Unaffected <span class='tooltip-term' data-term-info='Leukotriene B₄, a chemoattractant'>LTB₄</span> synthesis; potential <span class='tooltip-term' data-term-info='Metabolic redirection of a substrate when one pathway is blocked'>substrate shunting</span> towards <span class='tooltip-term' data-term-info='Lipoxygenase pathway'>LOX</span> pathway." },
                resolution: { text: 'Suppressed', statusClass: 'status-suppressed', explanation: "Blocks <span class='tooltip-term' data-term-info='Prostaglandin D₂'>PGD₂</span>/<span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span> derived <span class='tooltip-term' data-term-info='Signals that promote the end of inflammation'>resolution signals</span>. May impair <span class='tooltip-term' data-term-info='Lipoxins, pro-resolving mediators'>Lipoxin</span> generation." },
                cns: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Blocks central/peripheral <span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span> synthesis involved in <span class='tooltip-term' data-term-info='Elevated body temperature'>fever</span> and <span class='tooltip-term' data-term-info='Increased pain sensitivity'>pain sensitization</span>." },
                platelets: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Platelet (blood clotting cell) specific Cyclooxygenase-1'>platelet COX-1</span>, reducing pro-aggregatory <span class='tooltip-term' data-term-info='Thromboxane A₂, promotes platelet aggregation'>TXA₂</span>." },
                bronchi: { text: 'Constricted', statusClass: 'status-constricted', explanation: "Blocks <span class='tooltip-term' data-term-info='Airway-widening'>bronchodilatory</span> <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>; <span class='tooltip-term' data-term-info='Leukotrienes, often bronchoconstricting'>LTs</span> may dominate (risk in <span class='tooltip-term' data-term-info='Aspirin-Exacerbated Respiratory Disease, a condition where aspirin/NSAIDs worsen asthma/nasal polyps due to leukotriene overproduction'>AERD</span>)." },
                cvTone: { text: 'Vasoconstricted', statusClass: 'status-vasoconstricted', explanation: "Blocks vasodilatory <span class='tooltip-term' data-term-info='Prostacyclin'>PGI₂</span>/<span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span>; <span class='tooltip-term' data-term-info='Effects on the kidneys'>Renal effects</span> & unopposed <span class='tooltip-term' data-term-info='20-Hydroxyeicosatetraenoic acid, a vasoconstrictor'>20-HETE</span> (if active) contribute to increased tone/<span class='tooltip-term' data-term-info='Blood Pressure'>BP</span>." },
                stomach: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Stomach-protective'>protective</span> <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> (<span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span>/<span class='tooltip-term' data-term-info='Prostacyclin'>PGI₂</span>) via <span class='tooltip-term' data-term-info='Cyclooxygenase-1'>COX-1</span> inhibition." },
                kidney: { text: 'Impaired', statusClass: 'status-impaired', explanation: "Blocks <span class='tooltip-term' data-term-info='Cyclooxygenase 1 and 2'>COX-1/2</span> derived <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> essential for <span class='tooltip-term' data-term-info='Blood flow to the kidneys'>renal blood flow</span> and function, potentially leading to <span class='tooltip-term' data-term-info='Sodium and water buildup'>Na⁺/H₂O retention</span>." },
                uterus: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> involved in <span class='tooltip-term' data-term-info='Uterine muscle contractions'>uterine contractions</span>. Used to treat <span class='tooltip-term' data-term-info='Painful menstruation'>dysmenorrhea</span>." }
            }
        },
        cox2i: {
            inhibited: ['cox2'], blocked: ['pge2', 'pgd2', 'pgi2'], // Note: TXA2 mainly COX-1, so less direct block from COX2i
            readouts: {
                inflammationVasc: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Selectively blocks <span class='tooltip-term' data-term-info='Cyclooxygenase-2, often induced in inflammation'>COX-2</span> derived <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> (<span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span>, <span class='tooltip-term' data-term-info='Prostacyclin'>PGI₂</span>)." },
                inflammationLeuk: { text: 'Increased', statusClass: 'status-increased', explanation: "<span class='tooltip-term' data-term-info='Leukotriene B₄'>LTB₄</span> unaffected by <span class='tooltip-term' data-term-info='Cyclooxygenase-2'>COX-2</span> inhibition." },
                resolution: { text: 'Suppressed', statusClass: 'status-suppressed', explanation: "May block <span class='tooltip-term' data-term-info='Cyclooxygenase-2'>COX-2</span> dependent <span class='tooltip-term' data-term-info='Signals that promote the end of inflammation'>resolution signals</span> (e.g., <span class='tooltip-term' data-term-info='Prostaglandin D₂'>PGD₂</span>/<span class='tooltip-term' data-term-info='Prostacyclin'>PGI₂</span> roles)." },
                cns: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Cyclooxygenase-2'>COX-2</span> derived <span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span> involved in <span class='tooltip-term' data-term-info='Elevated body temperature'>fever</span>/<span class='tooltip-term' data-term-info='Pain sensation'>pain</span>." },
                platelets: { text: 'Increased Risk', statusClass: 'status-increased-risk', explanation: "Spares <span class='tooltip-term' data-term-info='Platelet-specific Cyclooxygenase-1, produces TXA₂'>platelet COX-1</span> (pro-aggregatory <span class='tooltip-term' data-term-info='Thromboxane A₂'>TXA₂</span>), while blocking <span class='tooltip-term' data-term-info='Endothelial cells lining blood vessels'>endothelial</span> <span class='tooltip-term' data-term-info='Cyclooxygenase-2, produces PGI₂'>COX-2</span> (anti-aggregatory <span class='tooltip-term' data-term-info='Prostacyclin'>PGI₂</span>), tipping balance towards <span class='tooltip-term' data-term-info='Platelet clumping'>aggregation</span>." },
                bronchi: { text: 'Constricted', statusClass: 'status-constricted', explanation: "No direct effect on <span class='tooltip-term' data-term-info='Leukotrienes, often bronchoconstricting'>LTs</span>; baseline state may persist if LTs were contributing." },
                cvTone: { text: 'Vasoconstricted', statusClass: 'status-vasoconstricted', explanation: "Reduced <span class='tooltip-term' data-term-info='Prostacyclin, a vasodilator'>PGI₂</span> <span class='tooltip-term' data-term-info='Widening of blood vessels'>vasodilation</span>; unopposed <span class='tooltip-term' data-term-info='Thromboxane A₂, a vasoconstrictor'>TXA₂</span> and potentially <span class='tooltip-term' data-term-info='20-Hydroxyeicosatetraenoic acid, a vasoconstrictor'>20-HETE</span> may increase <span class='tooltip-term' data-term-info='Blood Pressure'>BP</span>. <span class='tooltip-term' data-term-info='Effects on the kidneys, can alter fluid balance and blood pressure'>Renal effects</span> also contribute." },
                stomach: { text: 'Normal', statusClass: 'status-normal', explanation: "Spares protective <span class='tooltip-term' data-term-info='Cyclooxygenase-1, important for gastric protection'>COX-1</span> derived <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>." },
                kidney: { text: 'Impaired', statusClass: 'status-impaired', explanation: "Blocks <span class='tooltip-term' data-term-info='Cyclooxygenase-2, important for some kidney functions'>COX-2</span> derived <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> important for <span class='tooltip-term' data-term-info='Kidney function'>renal function</span>, especially in stressed states." },
                uterus: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Cyclooxygenase-2'>COX-2</span> derived <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> involved in <span class='tooltip-term' data-term-info='Uterine muscle tone'>uterine tone</span>." }
            }
        },
        aspirin: { // Low dose effects
            inhibited: ['cox1'], // Irreversibly inhibits platelet COX-1 primarily. Acetylates COX-2.
            blocked: ['txa2'], // Primarily platelet TXA2.
            readouts: {
                inflammationVasc: { text: 'Slightly Reduced', statusClass: 'status-slightly-reduced', explanation: "Minor effect on inflammatory <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> at low <span class='tooltip-term' data-term-info='Dosage'>dose</span>. <span class='tooltip-term' data-term-info='Acetyl group transfer'>Acetylated</span> <span class='tooltip-term' data-term-info='Cyclooxygenase-2'>COX-2</span> shifts profile." },
                inflammationLeuk: { text: 'Increased', statusClass: 'status-increased', explanation: "<span class='tooltip-term' data-term-info='Leukotriene B₄'>LTB₄</span> unaffected; potential for shunting to LOX pathway, especially in <span class='tooltip-term' data-term-info='Aspirin-Exacerbated Respiratory Disease'>AERD</span>." },
                resolution: { text: 'Promoting', statusClass: 'status-promoting', explanation: "<span class='tooltip-term' data-term-info='Addition of an acetyl group to a molecule'>Acetylated</span> <span class='tooltip-term' data-term-info='Cyclooxygenase-2'>COX-2</span> generates <span class='tooltip-term' data-term-info='Molecules that are converted into other molecules'>precursors</span> for <span class='tooltip-term' data-term-info='Specialized pro-resolving mediators formed when aspirin acetylates COX-2'>Aspirin-Triggered Lipoxins (ATLs)</span>." },
                cns: { text: 'Slightly Reduced', statusClass: 'status-slightly-reduced', explanation: "Minimal central effect at low <span class='tooltip-term' data-term-info='Preventing platelet aggregation'>anti-platelet</span> doses. Higher doses for analgesia/antipyresis." },
                platelets: { text: 'Very Reduced', statusClass: 'status-very-reduced', explanation: "<span class='tooltip-term' data-term-info='Permanent blockade'>Irreversibly blocks</span> <span class='tooltip-term' data-term-info='Platelet-specific Cyclooxygenase-1'>platelet COX-1</span>, drastically reducing <span class='tooltip-term' data-term-info='Thromboxane A₂'>TXA₂</span> for <span class='tooltip-term' data-term-info='The lifespan of a platelet, typically 7-10 days'>platelet lifespan</span>." },
                bronchi: { text: 'Constricted (Risk)', statusClass: 'status-constricted', explanation: "Risk of <span class='tooltip-term' data-term-info='Aspirin-Exacerbated Respiratory Disease'>AERD</span> due to <span class='tooltip-term' data-term-info='Leukotriene, bronchoconstricting mediators'>LT</span> shift in susceptible individuals." },
                cvTone: { text: 'Vasodilated', statusClass: 'status-vasodilated', explanation: "Reduced <span class='tooltip-term' data-term-info='Thromboxane A₂, a vasoconstrictor'>TXA₂</span> (vasoconstrictor, platelet aggregator) outweighs other effects at low dose, favoring relative <span class='tooltip-term' data-term-info='Widening of blood vessels'>vasodilation</span>. <span class='tooltip-term' data-term-info='Prostacyclin'>PGI₂</span> production (COX-2) relatively spared." },
                stomach: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Inhibits protective <span class='tooltip-term' data-term-info='Cyclooxygenase-1'>COX-1</span> derived <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>, increasing risk of <span class='tooltip-term' data-term-info='Damage to the stomach lining'>gastric injury</span>." },
                kidney: { text: 'Slightly Impaired', statusClass: 'status-slightly-impaired', explanation: "Less <span class='tooltip-term' data-term-info='Kidney-related'>renal</span> risk than typical <span class='tooltip-term' data-term-info='Non-Steroidal Anti-Inflammatory Drugs'>NSAIDs</span> at low dose, but still can impair function by reducing <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> important for renal perfusion." },
                uterus: { text: 'Slightly Reduced', statusClass: 'status-slightly-reduced', explanation: "Minimal effect at low dose on uterine PGs. Higher doses can reduce PG-mediated contractions." }
            }
        },
        csteroid: {
           inhibited: ['pla2', 'cox2'], // Corticosteroids inhibit PLA2 (via Annexin A1) and suppress COX-2 gene expression.
           blocked: ['aa-pool', 'pgh2', 'pge2', 'pgd2', 'pgi2', 'txa2', 'lta4', 'ltb4', 'cyslt', 'lipoxins', 'eets', 'hete20'], // Broadly reduces all AA metabolites
           readouts: {
               inflammationVasc: { text: 'Very Reduced', statusClass: 'status-very-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Arachidonic Acid'>AA</span> release <span class='tooltip-term' data-term-info='Earlier in a metabolic pathway'>upstream</span> via <span class='tooltip-term' data-term-info='Phospholipase A₂, enzyme releasing AA'>PLA₂</span> inhibition (via <span class='tooltip-term' data-term-info='Lipocortin-1/Annexin A1'>Annexin A1</span>); <span class='tooltip-term' data-term-info='Reduces the production of an enzyme'>suppresses COX-2 gene expression</span>, reducing <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>." },
               inflammationLeuk: { text: 'Very Reduced', statusClass: 'status-very-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Arachidonic Acid'>AA</span> release, reducing <span class='tooltip-term' data-term-info='Leukotriene B₄'>LTB₄</span> synthesis. Also suppresses expression of many <span class='tooltip-term' data-term-info='Cell signaling molecules'>cytokines</span> & <span class='tooltip-term' data-term-info='Proteins on cell surfaces that allow cells to stick together'>adhesion molecules</span>." },
               resolution: { text: 'Promoting', statusClass: 'status-promoting', explanation: "Induces <span class='tooltip-term' data-term-info='A protein with anti-inflammatory and pro-resolving properties, induced by corticosteroids'>Annexin A1</span>, which has <span class='tooltip-term' data-term-info='Actions that promote the resolution of inflammation'>pro-resolving</span> actions (e.g., stimulates <span class='tooltip-term' data-term-info='Specialized Pro-resolving Mediator'>SPM</span> production, inhibits <span class='tooltip-term' data-term-info='White blood cell'>leukocyte</span> <span class='tooltip-term' data-term-info='Movement of cells from blood vessels into tissues'>extravasation</span>)." },
               cns: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Reduced central <span class='tooltip-term' data-term-info='Prostaglandin E₂'>PGE₂</span> synthesis. Broad anti-inflammatory effects reduce pain signals." },
               platelets: { text: 'Normal', statusClass: 'status-normal', explanation: "No direct effect on <span class='tooltip-term' data-term-info='Platelet-specific Cyclooxygenase-1'>platelet COX-1</span>. Overall AA reduction might slightly lower TXA2, but generally not clinically significant for aggregation." },
               bronchi: { text: 'Dilated', statusClass: 'status-dilated', explanation: "Reduced <span class='tooltip-term' data-term-info='Cysteinyl Leukotrienes, bronchoconstrictors'>CysLT</span> synthesis and broad anti-inflammatory effects reduce <span class='tooltip-term' data-term-info='Swelling and narrowing of airways'>airway inflammation</span> and <span class='tooltip-term' data-term-info='Over-responsiveness of airways'>hyperresponsiveness</span>." },
               cvTone: { text: 'Balanced', statusClass: 'status-balanced', explanation: "Complex; reduced inflammatory <span class='tooltip-term' data-term-info='Blood vessel affecting'>vasoactive</span> mediators. Potential <span class='tooltip-term' data-term-info='Effects similar to mineralocorticoid hormones, can cause sodium/water retention and increase blood pressure'>mineralocorticoid effects</span> (Na⁺/H₂O retention) can increase <span class='tooltip-term' data-term-info='Blood Pressure'>BP</span>." },
               stomach: { text: 'Reduced Risk?', statusClass: 'status-slightly-reduced', explanation: "<span class='tooltip-term' data-term-info='Happening quickly'>Acutely</span> reduces inflammation, potentially protective. <span class='tooltip-term' data-term-info='Prolonged usage'>Long-term use</span> can impair <span class='tooltip-term' data-term-info='Tissue repair process'>mucosal healing</span> and increase risk with <span class='tooltip-term' data-term-info='Non-Steroidal Anti-Inflammatory Drugs'>NSAIDs</span>." },
               kidney: { text: 'Risk of Impairment', statusClass: 'status-risk-of-impairment', explanation: "Complex effects. Can cause <span class='tooltip-term' data-term-info='Accumulation of excess fluid in body tissues'>fluid retention</span>. High doses or long-term use can affect <span class='tooltip-term' data-term-info='The main filtering units of the kidney'>glomerular</span> function." },
               uterus: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Reduced <span class='tooltip-term' data-term-info='Prostaglandin'>PG</span> synthesis reduces <span class='tooltip-term' data-term-info='Uterine muscle activity'>uterine activity</span>." }
           }
        },
        loxi: { // 5-LOX inhibitors (e.g., Zileuton)
            inhibited: ['lox5', 'flap'], // FLAP interaction is crucial for 5-LOX
            blocked: ['lta4', 'ltb4', 'cyslt', 'lipoxins'], // Blocks all 5-LOX downstream products including lipoxins
            readouts: {
                inflammationVasc: { text: 'Slightly Reduced', statusClass: 'status-slightly-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Cysteinyl Leukotrienes, increase vascular permeability'>CysLTs</span> which increase <span class='tooltip-term' data-term-info='Leakiness of blood vessels'>vascular permeability</span>." },
                inflammationLeuk: { text: 'Reduced', statusClass: 'status-reduced', explanation: "Blocks synthesis of <span class='tooltip-term' data-term-info='Cell-attracting'>chemoattractant</span> <span class='tooltip-term' data-term-info='Leukotriene B₄'>LTB₄</span>." },
                resolution: { text: 'Suppressed', statusClass: 'status-suppressed', explanation: "Blocks <span class='tooltip-term' data-term-info='5-Lipoxygenase, an enzyme'>5-LOX</span> required for <span class='tooltip-term' data-term-info='Lipoxins, pro-resolving mediators'>Lipoxin</span> synthesis." },
                cns: { text: 'Increased', statusClass: 'status-increased', explanation: "Does not affect <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> involved in <span class='tooltip-term' data-term-info='Elevated body temperature'>fever</span>/<span class='tooltip-term' data-term-info='Pain sensation'>pain</span>. (Remains as triggered)" },
                platelets: { text: 'Normal', statusClass: 'status-normal', explanation: "No effect on <span class='tooltip-term' data-term-info='Cyclooxygenase pathway, produces prostaglandins and thromboxanes'>COX pathway</span>/<span class='tooltip-term' data-term-info='Thromboxane A₂'>TXA₂</span>." },
                bronchi: { text: 'Dilated', statusClass: 'status-dilated', explanation: "Blocks synthesis of <span class='tooltip-term' data-term-info='Airway-narrowing'>bronchoconstricting</span> <span class='tooltip-term' data-term-info='Cysteinyl Leukotrienes'>CysLTs</span>." },
                cvTone: { text: 'Balanced', statusClass: 'status-balanced', explanation: "No major direct effect on <span class='tooltip-term' data-term-info='Blood vessel affecting'>vasoactive</span> <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>/<span class='tooltip-term' data-term-info='Thromboxane A₂'>TXA₂</span>. Reduction in inflammatory <span class='tooltip-term' data-term-info='Leukotrienes'>LTs</span> may indirectly benefit." },
                stomach: { text: 'Normal', statusClass: 'status-normal', explanation: "No effect on protective <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>." },
                kidney: { text: 'Normal', statusClass: 'status-normal', explanation: "<span class='tooltip-term' data-term-info='Leukotrienes'>Leukotrienes</span> have less direct role in baseline <span class='tooltip-term' data-term-info='Kidney function'>kidney function</span>, but may be involved in <span class='tooltip-term' data-term-info='Kidney inflammation'>renal inflammation</span>." },
                uterus: { text: 'Increased', statusClass: 'status-increased', explanation: "Does not affect <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> involved in <span class='tooltip-term' data-term-info='Uterine muscle tone'>uterine tone</span>. (Remains as triggered)" }
            }
        },
        ltra: { // Leukotriene Receptor Antagonists (e.g., Montelukast - CysLT1 receptor antagonist)
            inhibited: [], // Does not inhibit enzymes
            blocked: ['cyslt'], // Blocks action of CysLTs at CysLT1 receptor, not their synthesis.
            readouts: {
                inflammationVasc: { text: 'Slightly Reduced', statusClass: 'status-slightly-reduced', explanation: "Blocks <span class='tooltip-term' data-term-info='Cysteinyl Leukotriene'>CysLT</span> action at <span class='tooltip-term' data-term-info='CysLT1 receptor'>CysLT1 receptor</span>, reducing increase in <span class='tooltip-term' data-term-info='Leakiness of blood vessels'>vascular permeability</span>." },
                inflammationLeuk: { text: 'Increased', statusClass: 'status-increased', explanation: "Does not block <span class='tooltip-term' data-term-info='Leukotriene B₄'>LTB₄</span> synthesis or action (which uses <span class='tooltip-term' data-term-info='BLT1 and BLT2 receptors for LTB4'>BLT receptors</span>). (Remains as triggered)" },
                resolution: { text: 'Normal', statusClass: 'status-normal', explanation: "No direct effect on major <span class='tooltip-term' data-term-info='Pathways that actively end inflammation'>resolution pathways</span> like <span class='tooltip-term' data-term-info='Lipoxins'>Lipoxin</span> synthesis." },
                cns: { text: 'Increased', statusClass: 'status-increased', explanation: "Does not affect <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> involved in <span class='tooltip-term' data-term-info='Elevated body temperature'>fever</span>/<span class='tooltip-term' data-term-info='Pain sensation'>pain</span>. (Remains as triggered)" },
                platelets: { text: 'Normal', statusClass: 'status-normal', explanation: "No significant effect on <span class='tooltip-term' data-term-info='Substances affecting platelet function'>platelet mediators</span> or aggregation." },
                bronchi: { text: 'Dilated', statusClass: 'status-dilated', explanation: "Blocks <span class='tooltip-term' data-term-info='Airway-narrowing'>bronchoconstricting</span> action of <span class='tooltip-term' data-term-info='Cysteinyl Leukotrienes'>CysLTs</span> at the <span class='tooltip-term' data-term-info='Cellular protein that binds a specific molecule (CysLT1)'>receptor</span>." },
                cvTone: { text: 'Balanced', statusClass: 'status-balanced', explanation: "No major direct effect on <span class='tooltip-term' data-term-info='Blood vessel affecting'>vasoactive</span> <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>/<span class='tooltip-term' data-term-info='Thromboxane A₂'>TXA₂</span>." },
                stomach: { text: 'Normal', statusClass: 'status-normal', explanation: "No effect on protective <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span>." },
                kidney: { text: 'Normal', statusClass: 'status-normal', explanation: "<span class='tooltip-term' data-term-info='Cysteinyl Leukotrienes'>CysLTs</span> have less direct role in baseline <span class='tooltip-term' data-term-info='Kidney function'>kidney function</span>." },
                uterus: { text: 'Increased', statusClass: 'status-increased', explanation: "Does not affect <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> involved in <span class='tooltip-term' data-term-info='Uterine muscle tone'>uterine tone</span>. (Remains as triggered)" }
            }
        },
        // New Drug Effects
        betaBlocker: { // Non-selective (e.g., Propranolol)
            inhibited: [], blocked: [],
            readouts: {
                // inflammationVasc & inflammationLeuk: Unchanged from triggered state unless specified.
                // resolution: Unchanged from triggered.
                // cns: May mask hypoglycemia symptoms, but not direct pain/fever PG effect. Unchanged from triggered.
                platelets: { text: 'Normal', statusClass: 'status-normal', explanation: "Beta-blockers generally do not directly affect <span class='tooltip-term' data-term-info='Platelet clumping'>platelet aggregation</span> or <span class='tooltip-term' data-term-info='Thromboxane A₂'>TXA₂</span> synthesis significantly." },
                bronchi: { text: 'Constricted', statusClass: 'status-constricted', explanation: "Non-selective <span class='tooltip-term' data-term-info='Drugs that block beta-adrenergic receptors'>β-blockers</span> block <span class='tooltip-term' data-term-info='Beta-2 adrenergic receptors, mediate bronchodilation'>β₂ receptors</span> in airways, leading to <span class='tooltip-term' data-term-info='Narrowing of airways'>bronchoconstriction</span>. Caution in <span class='tooltip-term' data-term-info='Asthma'>asthma</span>/<span class='tooltip-term' data-term-info='Chronic Obstructive Pulmonary Disease'>COPD</span>. May worsen effect of <span class='tooltip-term' data-term-info='Cysteinyl Leukotrienes'>CysLTs</span>." },
                cvTone: { text: 'Reduced Activity', statusClass: 'status-reduced-activity', explanation: "Blocks <span class='tooltip-term' data-term-info='Beta-1 adrenergic receptors, increase heart rate and contractility'>β₁ receptors</span> in heart (↓<span class='tooltip-term' data-term-info='Heart Rate'>HR</span>, ↓contractility). Non-selective may initially cause <span class='tooltip-term' data-term-info='Vasoconstriction'>vasoconstriction</span> (unopposed <span class='tooltip-term' data-term-info='Alpha-adrenergic receptors, mediate vasoconstriction'>α</span>-effects) then vasodilation. Reduces <span class='tooltip-term' data-term-info='Blood Pressure'>BP</span> long-term. <span class='tooltip-term' data-term-info='Non-Steroidal Anti-Inflammatory Drugs'>NSAIDs</span> can antagonize antihypertensive effect." },
                // stomach: Unchanged from triggered.
                kidney: { text: 'Reduced Renin', statusClass: 'status-reduced-renin', explanation: "Blocks <span class='tooltip-term' data-term-info='Beta-1 adrenergic receptors'>β₁ receptors</span> in <span class='tooltip-term' data-term-info='Juxtaglomerular apparatus in the kidney, produces renin'>juxtaglomerular cells</span>, reducing <span class='tooltip-term' data-term-info='An enzyme that converts angiotensinogen to angiotensin I, a step in raising blood pressure'>renin</span> release, thus ↓<span class='tooltip-term' data-term-info='Angiotensin II, a potent vasoconstrictor'>Ang II</span> & <span class='tooltip-term' data-term-info='Aldosterone, a hormone that causes sodium and water retention'>aldosterone</span>. <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> influence renin release, so interaction is complex." },
                uterus: { text: 'Relaxed', statusClass: 'status-relaxed', explanation: "<span class='tooltip-term' data-term-info='Beta-2 adrenergic receptors'>β₂ receptor</span> blockade can reduce <span class='tooltip-term' data-term-info='Relaxation of uterine muscle'>tocolytic</span> effect if β₂ agonists are used. Baseline tone change less prominent than with PGs." }
            }
        },
        aceInhibitor: { // e.g., Lisinopril
            inhibited: [], blocked: [],
            readouts: {
                // inflammationVasc & inflammationLeuk: May have some anti-inflammatory benefits by reducing Ang II. Unchanged from triggered.
                // resolution: Unchanged from triggered, though reduced Ang II might be beneficial.
                // cns: Unchanged from triggered.
                platelets: { text: 'Normal', statusClass: 'status-normal', explanation: "<span class='tooltip-term' data-term-info='Angiotensin-Converting Enzyme Inhibitors'>ACE inhibitors</span> do not directly have major effects on <span class='tooltip-term' data-term-info='Platelet clumping'>platelet aggregation</span>." },
                bronchi: { text: 'Risk of Cough', statusClass: 'status-risk-of-cough', explanation: "Inhibits <span class='tooltip-term' data-term-info='Angiotensin-Converting Enzyme, also known as Kininase II'>ACE (Kininase II)</span>, leading to accumulation of <span class='tooltip-term' data-term-info='A peptide that causes vasodilation and can irritate airways'>bradykinin</span> and <span class='tooltip-term' data-term-info='Substance P, a neuropeptide involved in pain and inflammation'>Substance P</span>, which can cause dry <span class='tooltip-term' data-term-info='A reflex to clear airways'>cough</span> and rarely <span class='tooltip-term' data-term-info='Swelling beneath the skin, often around eyes and lips'>angioedema</span>. <span class='tooltip-term' data-term-info='Prostaglandins'>PGs</span> may contribute to cough." },
                cvTone: { text: 'Vasodilated', statusClass: 'status-vasodilated', explanation: "Reduces <span class='tooltip-term' data-term-info='Angiotensin II, a potent vasoconstrictor'>Angiotensin II</span> (vasoconstrictor) and increases <span class='tooltip-term' data-term-info='Bradykinin, a vasodilator'>bradykinin</span> (vasodilator, stimulates <span class='tooltip-term' data-term-info='Nitric Oxide, a vasodilator'>NO</span>/<span class='tooltip-term' data-term-info='Prostacyclin, a vasodilator'>PGI₂</span> release). Lowers <span class='tooltip-term' data-term-info='Blood Pressure'>BP</span>. <span class='tooltip-term' data-term-info='Non-Steroidal Anti-Inflammatory Drugs'>NSAIDs</span> can antagonize antihypertensive effect by inhibiting vasodilatory PGs." },
                // stomach: Unchanged from triggered.
                kidney: { text: 'Altered (Often Protective)', statusClass: 'status-altered-often-protective', explanation: "Reduces <span class='tooltip-term' data-term-info='Angiotensin II'>Ang II</span> mediated <span class='tooltip-term' data-term-info='The outgoing arteriole from the glomerulus in the kidney'>efferent arteriole</span> constriction, lowering <span class='tooltip-term' data-term-info='Pressure within the glomeruli, the kidney\'s filters'>glomerular pressure</span> (protective in <span class='tooltip-term' data-term-info='Kidney disease associated with diabetes'>diabetic nephropathy</span>). Can cause acute kidney injury if <span class='tooltip-term' data-term-info='Blood flow to the kidneys'>renal perfusion</span> is critically dependent on Ang II (e.g. <span class='tooltip-term' data-term-info='Narrowing of the artery supplying the kidney'>renal artery stenosis</span>). <span class='tooltip-term' data-term-info='Non-Steroidal Anti-Inflammatory Drugs'>NSAIDs</span> increase risk of kidney injury with ACEi." },
                uterus: { text: 'Normal', statusClass: 'status-normal', explanation: "No major direct effects on <span class='tooltip-term' data-term-info='Uterine muscle tone'>uterine tone</span>. Contraindicated in <span class='tooltip-term' data-term-info='The state of carrying a developing embryo or fetus'>pregnancy</span> due to fetal harm." }
            }
        },
        ccb: { // Dihydropyridine (e.g., Amlodipine)
            inhibited: [], blocked: [],
            readouts: {
                // inflammationVasc & inflammationLeuk: May have mild anti-inflammatory effects. Unchanged from triggered.
                // resolution: Unchanged from triggered.
                // cns: Can be used for migraine prophylaxis. PGE2 is vasodilator, CCBs also vasodilate. Unchanged from triggered for pain/fever.
                platelets: { text: 'Slightly Reduced', statusClass: 'status-slightly-reduced', explanation: "<span class='tooltip-term' data-term-info='Calcium Channel Blockers'>CCBs</span> can inhibit <span class='tooltip-term' data-term-info='Influx of calcium ions into the cell'>Ca²⁺ influx</span> into <span class='tooltip-term' data-term-info='Small blood cells involved in clotting'>platelets</span>, slightly reducing <span class='tooltip-term' data-term-info='Platelet clumping'>aggregation</span>, but this is generally not a primary clinical effect." },
                bronchi: { text: 'Dilated', statusClass: 'status-dilated', explanation: "Block <span class='tooltip-term' data-term-info='L-type calcium channels critical for smooth muscle contraction'>L-type Ca²⁺ channels</span> in <span class='tooltip-term' data-term-info='Muscle in the airway walls'>airway smooth muscle</span>, leading to <span class='tooltip-term' data-term-info='Widening of airways'>bronchodilation</span>. May offer some benefit in <span class='tooltip-term' data-term-info='Asthma'>asthma</span>." },
                cvTone: { text: 'Vasodilated', statusClass: 'status-vasodilated', explanation: "<span class='tooltip-term' data-term-info='Dihydropyridine Calcium Channel Blockers'>Dihydropyridines</span> primarily block <span class='tooltip-term' data-term-info='L-type calcium channels'>L-type Ca²⁺ channels</span> in <span class='tooltip-term' data-term-info='Muscle in blood vessel walls'>vascular smooth muscle</span>, causing potent <span class='tooltip-term' data-term-info='Widening of blood vessels'>vasodilation</span> and lowering <span class='tooltip-term' data-term-info='Blood Pressure'>BP</span>. May cause reflex <span class='tooltip-term' data-term-info='Increased heart rate'>tachycardia</span>." },
                // stomach: Unchanged from triggered.
                kidney: { text: 'Altered (Neutral/Beneficial)', statusClass: 'status-altered-often-neutral-beneficial', explanation: "Can cause <span class='tooltip-term' data-term-info='Widening of blood vessels in the kidneys'>renal vasodilation</span>, improving <span class='tooltip-term' data-term-info='Blood flow to the kidneys'>renal blood flow</span>. Effects on <span class='tooltip-term' data-term-info='Sodium excretion in urine'>natriuresis</span> are variable. Generally considered safe for kidneys." },
                uterus: { text: 'Relaxed', statusClass: 'status-relaxed', explanation: "Block <span class='tooltip-term' data-term-info='L-type calcium channels'>L-type Ca²⁺ channels</span> in <span class='tooltip-term' data-term-info='Uterine smooth muscle'>uterine smooth muscle</span>, leading to <span class='tooltip-term' data-term-info='Relaxation of the uterus'>relaxation</span>. Some CCBs (e.g., Nifedipine) used as <span class='tooltip-term' data-term-info='Drugs that suppress premature labor'>tocolytics</span>." }
            }
        }
    };

    triggerBtn.addEventListener('click', triggerCascade);
    controls.resetBtn.addEventListener('click', resetSimulation);

    for (const drugKey in drugEffects) {
        const buttonIdRaw = drugKey.replace(/([A-Z])([A-Z]+)/g, (match, p1, p2) => `-${p1.toLowerCase()}${p2}`)
                                   .replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        
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
            // Listener for applying drug effect
            button.addEventListener('click', () => applyDrugEffect(
                drugKey,
                drugEffects[drugKey].inhibited,
                drugEffects[drugKey].blocked,
                drugEffects[drugKey].readouts
            ));

            // Add tooltip listeners if data-drug-info exists
            if (button.dataset.drugInfo) {
                if (isMobile) {
                    button.addEventListener('click', (event) => {
                        // This click listener for tooltips runs alongside the one for applyDrugEffect.
                        // On mobile, clicking a drug button will both apply its effect and show/toggle its tooltip.
                        event.stopPropagation(); 
                        if (activeTooltipNode === button && mainTooltip.style.visibility === 'visible') {
                            hideMainTooltip(true);
                        } else {
                            showMainTooltip(button, event);
                        }
                    });
                } else { // Desktop
                    button.addEventListener('mouseenter', (event) => showMainTooltip(button, event));
                    button.addEventListener('mouseleave', () => hideMainTooltip());
                }
            }
        } else {
            console.warn("Button not found for drug:", drugKey, "Expected key in controls:", buttonIdCamel);
        }
    }

    // Initial setup
    if (isMobile) {
        // Ensure first pathway is selected by default on mobile
        pathwaySelectButtons.forEach((btn, index) => {
             btn.classList.toggle('active', index === 0);
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
    resetSimulation(); // Call resetSimulation to set initial readouts and states

    // PC Layout specific logic (optional, was in original)
    function checkPCLayout() {
        const mainContainerStyle = window.getComputedStyle(document.querySelector('.main-container'));
        if (mainContainerStyle.flexDirection === 'row') {
            if (diagramColumn) diagramColumn.style.display = 'flex';
            if (panelsColumn) panelsColumn.style.display = 'flex';
        } else {
            if (diagramColumn) diagramColumn.style.display = 'block'; // or 'flex' if it's still a flex column
            if (panelsColumn) panelsColumn.style.display = 'block'; // or 'flex'
        }
    }
    // window.addEventListener('resize', checkPCLayout);
    // checkPCLayout(); 

}); // End DOMContentLoaded