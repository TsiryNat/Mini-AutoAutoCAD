const source = new ol.source.Vector({ wrapX: false });

    // ============================================================================
    // --- declaration (ilaina rehefa any ambany any) ---

    let currentPolyStrokeWidth = 2;
    let currentPolyStrokeColor = 'black';
    let currentPolyFillColor   = 'rgba(0,0,0,0.15)';

    let currentTextContent = '';
    let currentTextSize = '16';
    let currentTextCase = 'as-is';
    let currentTextStyle = 'normal';

    // ============================================================================
    // --- Styles ---
    const defaultStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({ color: 'black', width: 2 }),
        fill: new ol.style.Fill({ color: 'rgba(0,0,0,0.2)' }),
    });

    const borneStyle = new ol.style.Style({
        image: new ol.style.Icon({
            src: 'icone/borne.png',
            scale: 0.04
        })
    });

    // ============================================================================
    // --- Arrow Style ---
    function arrowStyle(feature) {
        const geometry = feature.getGeometry();
        const coords = geometry.getCoordinates();
        const start = coords[0];
        const end = coords[coords.length - 1];

        const startPx = map.getPixelFromCoordinate(start);
        const endPx = map.getPixelFromCoordinate(end);

        const dx = endPx[0] - startPx[0];
        const dy = endPx[1] - startPx[1];
        const angle = Math.atan2(dy, dx);

        return [
            new ol.style.Style({
                stroke: new ol.style.Stroke({ color: 'black', width: 1 })
            }),
            new ol.style.Style({
                geometry: new ol.geom.Point(end),
                image: new ol.style.Icon({
                    src: 'icone/teteFleche.png',
                    rotateWithView: false,
                    rotation: angle,
                    scale: 0.04
                })
            })
        ];
    }

    // ============================================================================
    // --- générer le style du polygone ---

    function getPolygonStyle() {
        const colorValue = currentPolyStrokeColor;
        const width      = parseInt(currentPolyStrokeWidth);

        // Remplissage (inchangé)
        const fill = currentPolyFillColor === 'none'
            ? undefined
            : new ol.style.Fill({ color: currentPolyFillColor });

        // Cas spécial : double ligne neutre (pas de couleur → effet "deux lignes parallèles")
        if (colorValue === 'none-double') {
            return [
                // Ligne extérieure large (souvent gris foncé ou noir)
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#444',           // gris foncé / noir discret
                        width: width + 2         // un peu plus large pour bien encadrer
                    })
                }),
                // Ligne intérieure = "espace" (blanc ou très clair)
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'white',          // crée l'espace visible
                        width: width - 1         // ajuste selon le rendu voulu
                    })
                }),
                // Ligne centrale très fine (optionnelle, pour marquer le milieu)
                // new ol.style.Style({
                //     stroke: new ol.style.Stroke({
                //         color: '#444',
                //         width: 1.5
                //     })
                // })
            ];
        }

        // Cas normal : une seule ligne de couleur classique
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: colorValue,
                width: width
            }),
            fill: fill
        });
    }

    // ============================================================================
    // --- Gerer du Text ---

    function createTextStyleFromFeature(feature) {

        const text = feature.get('textValue') || '';
        const size = feature.get('textSize') || 16;
        const textCase = feature.get('textCase') || 'as-is';
        const styleVal = feature.get('textStyle') || 'normal';
        const rotation = feature.get('rotationValue') || 0;

        let fontWeight = 'normal';
        let fontStyle  = 'normal';
        let underline  = false;

        if (styleVal.includes('bold')) fontWeight = 'bold';
        if (styleVal.includes('italic')) fontStyle = 'italic';
        if (styleVal.includes('underline')) underline = true;

        let processedText = text;
        if (textCase === 'upper') processedText = text.toUpperCase();
        else if (textCase === 'lower') processedText = text.toLowerCase();
        else if (textCase === 'capitalize') {
            processedText = text.replace(/\b\w/g, l => l.toUpperCase());
        }

        return new ol.style.Style({
            text: new ol.style.Text({
                text: processedText,
                font: `${fontWeight} ${fontStyle} ${size}px Arial`,
                fill: new ol.style.Fill({ color: 'black' }),
                stroke: new ol.style.Stroke({ color: 'white', width: 3 }),
                rotation: rotation,
                textAlign: 'center',
                overflow: true,
                textBaseline: 'middle',
                textDecoration: underline ? 'underline' : undefined
            })
        });
    }


    // ============================================================================
    // --- Vector Layer ---
    const vectorLayer = new ol.layer.Vector({
        source: source,
        style: function(feature) {
            const type = feature.getGeometry().getType();
            const isNord = feature.get('isNord');

            if (isNord) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'icone/nord.png',
                        scale: 0.15,          // ajuste la taille selon tes besoins (plus grand que la borne)
                        anchor: [0.5, 0.5],   // centre l'icône sur le point
                        rotateWithView: false
                    })
                });
            }
            if (type === 'Point') return borneStyle;
            if (type === 'LineString' && feature.get('isArrow') === true) return arrowStyle(feature);
            return defaultStyle;
        }
    });

    // ============================================================================
    // --- Map (sans zoom controls) ---
    const map = new ol.Map({
        target: 'map',
        layers: [vectorLayer],
        controls: [], // <-- supprime tous les controles par défaut
        view: new ol.View({
            center: [0, 0],
            zoom: 5
        })
    });

    // ============================================================================
    // --- Draw Interaction ---

    let draw;

    function addDrawInteraction(type = 'Polygon') {
        if (draw) map.removeInteraction(draw);

        if (type === "Arrow") {
            draw = new ol.interaction.Draw({ source, type: "LineString" });
            draw.on("drawend", function(event) {
                event.feature.set("isArrow", true);
            });
        } 
        else if (type === "NordIcone") {
            draw = new ol.interaction.Draw({ source, type: "Point" });
            draw.on("drawend", function(event) {
                event.feature.set("isNord", true);
            });
        } 
        else if (type === "Polygon") {
            // Style pendant le dessin (preview)
            draw = new ol.interaction.Draw({
                source: source,
                type: "Polygon",
                style: getPolygonStyle()   // ← preview avec les choix
            });

            draw.on("drawend", function(event) {
                // Applique le même style à la feature finale
                event.feature.setStyle(getPolygonStyle());
            });
        }
        else if (type === 'Text') {
            // Ne rien faire ici – ou afficher un message
            console.log("Le texte n'utilise pas Draw – cliquez directement sur la carte après validation du modal");
            return;
        } 
        else {
            draw = new ol.interaction.Draw({ source, type });
        }

        map.addInteraction(draw);
    }

    // ============================================================================
    // ============================================================================
    // ======================== GESTION DES BOUTTONS ==============================
    // ============================================================================
    // ============================================================================

    // Sélection de tous les boutons du groupe d'outils
    const toolButtons = document.querySelectorAll('#tools button');

    // Gestion du clic sur chaque bouton
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Retire la classe active à tous les boutons
            toolButtons.forEach(btn => btn.classList.remove('active'));
            // Ajoute la classe active au bouton cliqué
            this.classList.add('active');

            // Lance la fonction de dessin avec le type du bouton
            addDrawInteraction(this.getAttribute('data-type'));
        });
    });

    // Optionnel : activer le premier bouton par défaut (ex: Polygone)
    const defaultButton = document.querySelector('#tools button[data-type="Polygon"]');
    if (defaultButton) {
        defaultButton.classList.add('active');
        addDrawInteraction('Polygon');  // ou la valeur que tu veux par défaut
    }


    // ============================================================================
    // ----- function getMapImage --------
    function getMapImage(callback) {
        map.once('rendercomplete', function () {
            const canvas = document.createElement('canvas');
            const size = map.getSize();
            canvas.width = size[0];
            canvas.height = size[1];
            const ctx = canvas.getContext('2d');

            // ← Ajout le plus important : fond blanc
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

           document.querySelectorAll('.ol-layer canvas, .ol-layer canvas.ol-unselectable').forEach(function (c) {
                if (c.width > 0) {
                    ctx.drawImage(c, 0, 0);
                }
            });

            callback(canvas);
        });
        map.renderSync();
    }

    // ============================================================================
    // ============================================================================
    // =========================== SIMULATION DES BOUTTONs ========================
    // ============================================================================
    // ============================================================================

    // Attendre que le DOM soit complètement chargé
    // ========== Gestion du bouton Export + modal ==========

    document.addEventListener('DOMContentLoaded', function() {

        const exportBtn    = document.getElementById('exportPDF');   // ← ton bouton original
        const modal        = document.getElementById('exportModal');
        const cancelBtn    = document.getElementById('cancelExport');
        const confirmBtn   = document.getElementById('confirmExport');
        const exportType   = document.getElementById('exportType');
        const pdfOptions   = document.getElementById('pdfOptions');
        const modalTitle   = document.getElementById('modalTitle');
        const confirmText  = confirmBtn.querySelector('span') || confirmBtn; // pour changer le texte

        // Mise à jour dynamique du titre et du bouton + affichage options PDF
        function updateUI() {
            const type = exportType.value;
            modalTitle.textContent = type === 'pdf' ? "Exporter en PDF" : "Exporter en JPEG";
            confirmBtn.textContent = type === 'pdf' ? "Exporter PDF" : "Exporter JPEG";
            
            pdfOptions.style.display = type === 'pdf' ? 'block' : 'none';
        }

        exportType.addEventListener('change', updateUI);
        updateUI(); // initial

        // Ouvrir le modal (remplace l'ancien onclick du bouton exportPDF)
        exportBtn.onclick = function() {
            modal.style.display = 'flex';
        };

        // Annuler
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
        };

        // Confirmer → lance l'export selon le choix
        confirmBtn.onclick = function() {
            const type = exportType.value;
            modal.style.display = 'none';

            getMapImage(function(canvas) {
                if (type === 'jpeg') {
                    // Export JPEG simple
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/jpeg', 0.95);
                    link.download = 'carte_export.jpg';
                    link.click();
                } 
                else {
                    // Export PDF (logique précédente)
                    const { jsPDF } = window.jspdf;
                    const formatVal = document.getElementById('pdfFormat').value;
                    const dpi       = parseInt(document.getElementById('pdfDpi').value);

                    let pageWidth, pageHeight;
                    switch(formatVal) {
                        case 'a3':     pageWidth = 420; pageHeight = 297; break;
                        case 'a4':     pageWidth = 297; pageHeight = 210; break;
                        case 'a5':     pageWidth = 210; pageHeight = 148; break;
                        case 'letter': pageWidth = 215.9; pageHeight = 279.4; break;
                        default:       pageWidth = 297; pageHeight = 210;
                    }

                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: [pageWidth, pageHeight]
                    });

                    const scale = dpi / 72;
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width  = canvas.width  * scale;
                    tempCanvas.height = canvas.height * scale;
                    const ctx = tempCanvas.getContext('2d');
                    ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

                    pdf.addImage(
                        tempCanvas.toDataURL('image/jpeg', 0.92),
                        'JPEG',
                        0, 0,
                        pageWidth,
                        pageHeight
                    );

                    pdf.output('dataurlnewwindow');  // ouvre dans nouvel onglet
                    pdf.save(`carte_${formatVal}_${dpi}dpi.pdf`);
                }
            });
        };

        // Clic en dehors → fermer
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.style.display = 'none';
        });
    });

    // ============================================================================
    // ========== Gestion du bouton Polygone + modal ==========

    document.addEventListener('DOMContentLoaded', function() {

        // Sélectionne le bouton Polygone
        const polyButton = document.querySelector('#tools button[data-type="Polygon"]');
        
        if (polyButton) {
            polyButton.addEventListener('click', function() {
                // Affiche le modal au lieu de démarrer directement
                document.getElementById('polygonModal').style.display = 'flex';
                
                // Optionnel : retire 'active' des autres boutons si tu gères ça
                document.querySelectorAll('#tools button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        }

        // Bouton Annuler
        document.getElementById('cancelPoly').onclick = function() {
            document.getElementById('polygonModal').style.display = 'none';
            // Optionnel : retire active du bouton Polygone
            document.querySelector('#tools button[data-type="Polygon"]').classList.remove('active');
        };

        // Bouton Commencer
        document.getElementById('startPoly').onclick = function() {
            // Récupère les choix
            currentPolyStrokeWidth = document.getElementById('polyStrokeWidth').value;
            currentPolyStrokeColor = document.getElementById('polyStrokeColor').value;
            currentPolyFillColor   = document.getElementById('polyFill').value;

            // Ferme le modal
            document.getElementById('polygonModal').style.display = 'none';

            // Lance le dessin avec les paramètres choisis
            addDrawInteraction('Polygon');
        };

        // Optionnel : fermer modal si clic en dehors
        document.getElementById('polygonModal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });

    // ============================================================================
    // ========== Gestion du bouton Text + modal ==========

    document.addEventListener('DOMContentLoaded', function() {

        const textButton = document.querySelector('#tools button[data-type="Text"]');
        
        if (textButton) {
            textButton.addEventListener('click', function() {
                document.getElementById('textModal').style.display = 'flex';
                // Optionnel : active visuel
                document.querySelectorAll('#tools button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        }

        // Annuler
        document.getElementById('cancelText').onclick = function() {
            document.getElementById('textModal').style.display = 'none';
            document.querySelector('#tools button[data-type="Text"]').classList.remove('active');
        };

        // Confirmer → prépare et active mode "ajout texte"
        document.getElementById('addTextConfirm').onclick = function() {
            currentTextContent = document.getElementById('textContent').value.trim();
            currentTextSize    = document.getElementById('textSize').value;
            currentTextCase    = document.getElementById('textCase').value;
            currentTextStyle   = document.getElementById('textStyle').value;

            document.getElementById('textModal').style.display = 'none';

            if (!currentTextContent) return;

            // Active une interaction temporaire pour placer le texte
            const clickToPlaceText = function(evt) {
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(evt.coordinate),
                    isText: true,
                    textValue: currentTextContent,
                    textSize: currentTextSize,
                    textCase: currentTextCase,
                    textStyle: currentTextStyle,
                    rotationValue: 0
                });

                feature.setStyle(createTextStyleFromFeature(feature));
                source.addFeature(feature);

                // Ré-active drag & rotation pour ce texte (comme avant)
                currentTextFeature = feature;  // réutilise la variable globale si tu gardes le drag/rotation

                map.un('singleclick', clickToPlaceText);  // désactive après placement
            };

            map.once('singleclick', clickToPlaceText);
        };

        // Clic extérieur pour fermer modal
        document.getElementById('textModal').addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    });

    // ============================================================================
    // ============================================================================
    // =========================== GESTION DU TEXT ================================
    // ============================================================================
    // ============================================================================

    // ========== Rotation du text ===========
        
    let isRotatingText = false;

    map.getViewport().addEventListener('contextmenu', e => e.preventDefault());

    map.on('pointerdown', function (evt) {
        if (evt.originalEvent.button === 2) { // clic droit
            const feature = map.forEachFeatureAtPixel(evt.pixel, f => f);
            if (feature && feature.get('isText')) {
                currentTextFeature = feature;
                isRotatingText = true;
            }
        }
    });

    map.on('pointerup', function () {
        isRotatingText = false;
    });

    map.on('pointermove', function (evt) {
        if (!isRotatingText || !currentTextFeature) return;

        const center = currentTextFeature.getGeometry().getCoordinates();
        const dx = evt.coordinate[0] - center[0];
        const dy = evt.coordinate[1] - center[1];

        const angle = Math.atan2(dy, dx);

        currentTextFeature.set('rotationValue', angle);
        currentTextFeature.setStyle(
            createTextStyleFromFeature(currentTextFeature)
        );
    });

    // ========== Deplacement du text ===========

    let isDraggingText = false;
    let draggedTextFeature = null;

    map.on('pointerdown', function (evt) {
        // CTRL + clic gauche uniquement
        if (evt.originalEvent.button !== 0 || !evt.originalEvent.ctrlKey) return;

        const feature = map.forEachFeatureAtPixel(evt.pixel, f => f);

        if (feature && feature.get('isText')) {
            draggedTextFeature = feature;
            isDraggingText = true;

            map.getViewport().style.cursor = 'move';

            // Empêche d'autres interactions
            evt.preventDefault();
        }
    });

    map.on('pointermove', function (evt) {
        if (!isDraggingText || !draggedTextFeature) return;

        draggedTextFeature
            .getGeometry()
            .setCoordinates(evt.coordinate);
    });

    map.on('pointerup', function () {
        isDraggingText = false;
        draggedTextFeature = null;
        map.getViewport().style.cursor = '';
    });