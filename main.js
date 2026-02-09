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

    let modePlacementBornesAuto = false;
    let premierSommetChoisi = null;
    let polygoneSelectionne = null;

    // ============================================================================
    // ============================================================================
    // ======================== VARIABLE & FUNCTION ===============================
    // ============================================================================
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

    // Nouvelle fonction pour créer un style polygone sans utiliser les globales
    function createPolygonStyle(strokeWidth, strokeColor, fillColor) {
        const width = parseInt(strokeWidth) || 2;  // fallback si manquant
        const fill = fillColor === 'none' 
            ? undefined 
            : new ol.style.Fill({ color: fillColor || 'rgba(0,0,0,0.15)' });

        // Cas spécial : double ligne neutre
        if (strokeColor === 'none-double') {
            return [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#444',
                        width: width + 2
                    })
                }),
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: width - 1
                    })
                })
                // Ligne centrale optionnelle (décommente si tu veux)
                // new ol.style.Style({
                //     stroke: new ol.style.Stroke({
                //         color: '#444',
                //         width: 1.5
                //     })
                // })
            ];
        }

        // Cas normal
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: strokeColor || 'black',
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
                        scale: 0.22,          // ajuste la taille selon tes besoins (plus grand que la borne)
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
                const feature = event.feature;
                // ────────────────────────────────────────────────
                // IMPORTANT : on stocke les valeurs actuelles DANS la feature
                // ────────────────────────────────────────────────
                feature.set('polyStrokeWidth', currentPolyStrokeWidth);
                feature.set('polyStrokeColor', currentPolyStrokeColor);
                feature.set('polyFill',       currentPolyFillColor);

                // Applique le même style à la feature finale
                feature.setStyle(getPolygonStyle());
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
    // --- Listener global pour détecter les clics en mode bornes auto  ---

    map.on('singleclick', function(evt) {
        if (!modePlacementBornesAuto) return;

        // Recherche du vertex le plus proche du clic
        let vertexTrouve = null;
        let distanceMin = Infinity;
        let polygoneCible = null;
        let indexVertex = -1;

        map.getLayers().forEach(layer => {
            if (layer instanceof ol.layer.Vector) {
                layer.getSource().getFeatures().forEach(feature => {
                    const geom = feature.getGeometry();
                    if (geom && geom.getType() === 'Polygon') {
                        const coords = geom.getCoordinates()[0]; // premier anneau (extérieur)

                        coords.forEach((coord, i) => {
                            const pixelCoord = map.getPixelFromCoordinate(coord);
                            const pixelClick = evt.pixel;
                            const dist = Math.hypot(pixelCoord[0] - pixelClick[0], pixelCoord[1] - pixelClick[1]);

                            if (dist < distanceMin && dist < 20) { // tolérance 20 pixels
                                distanceMin = dist;
                                vertexTrouve = coord;
                                polygoneCible = feature;
                                indexVertex = i;
                            }
                        });
                    }
                });
            }
        });

        // Si aucun vertex proche → annuler ou ignorer
        if (!vertexTrouve) {
            // Option : on peut annuler le mode si clic trop loin
            if (distanceMin > 50) {
                modePlacementBornesAuto = false;
                premierSommetChoisi = null;
                polygoneSelectionne = null;
                alert("Placement annulé (clic trop loin d'un coin).");
            }
            return;
        }

        // Premier clic → mémoriser le point de départ
        if (!premierSommetChoisi) {
            premierSommetChoisi = vertexTrouve;
            polygoneSelectionne = polygoneCible;

            // Placer la première borne
            ajouterBorne(vertexTrouve);
            return;
        }

        // Deuxième clic ou plus → on place toutes les bornes suivantes dans le sens horaire
        if (polygoneCible !== polygoneSelectionne) {
            alert("Veuillez cliquer sur un coin du même polygone.");
            return;
        }

        const anneau = polygoneSelectionne.getGeometry().getCoordinates()[0];
        const debutIndex = indexVertex;

        // Placement automatique dans le sens horaire à partir du point cliqué
        for (let i = debutIndex; i < anneau.length; i++) {
            ajouterBorne(anneau[i]);
        }

        // On boucle au début si nécessaire (pour fermer le polygone)
        for (let i = 0; i < debutIndex; i++) {
            ajouterBorne(anneau[i]);
        }

        // Fin du placement automatique
        modePlacementBornesAuto = false;
        premierSommetChoisi = null;
        polygoneSelectionne = null;

        alert("Placement automatique des bornes terminé (sens horaire).");
    });

    // Fonction pour ajouter une borne (Point avec style borne)
    function ajouterBorne(coord) {
        const borne = new ol.Feature({
            geometry: new ol.geom.Point(coord)
        });
        borne.setStyle(borneStyle);
        source.addFeature(borne);
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
        // Dans la boucle toolButtons.forEach
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');

            // Retirer le mode précédent si actif
            modePlacementBornesAuto = false;
            premierSommetChoisi = null;
            polygoneSelectionne = null;

            if (type === "Point") {  // Borne
                // On active le mode spécial au lieu du dessin normal
                modePlacementBornesAuto = true;
                alert("Cliquez sur un coin d'un polygone pour commencer le placement automatique des bornes (sens horaire).\nClic droit ou clic loin pour annuler.");
            } else {
                // Les autres types restent normaux
                addDrawInteraction(type);
            }

            // Visuel actif
            toolButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    // toolButtons.forEach(button => {
    //     button.addEventListener('click', function() {
    //         // Retire la classe active à tous les boutons
    //         toolButtons.forEach(btn => btn.classList.remove('active'));
    //         // Ajoute la classe active au bouton cliqué
    //         this.classList.add('active');

    //         // Lance la fonction de dessin avec le type du bouton
    //         addDrawInteraction(this.getAttribute('data-type'));
    //     });
    // });

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

        const exportBtn    = document.getElementById('exportPDF');
        const modal        = document.getElementById('exportModal');
        const cancelBtn    = document.getElementById('cancelExport');
        const confirmBtn   = document.getElementById('confirmExport');
        const exportType   = document.getElementById('exportType');
        const pdfOptions   = document.getElementById('pdfOptions');
        const modalTitle   = document.getElementById('modalTitle');

        // Mise à jour de l'interface selon le type choisi
        function updateUI() {
            const type = exportType.value;
            
            modalTitle.textContent = {
                'pdf':  "Exporter en PDF",
                'jpeg': "Exporter en JPEG",
                'json': "Exporter en JSON"
            }[type] || "Exporter la carte";

            confirmBtn.textContent = {
                'pdf':  "Exporter PDF",
                'jpeg': "Exporter JPEG",
                'json': "Exporter JSON"
            }[type] || "Exporter";

            pdfOptions.style.display = (type === 'pdf') ? 'block' : 'none';
        }

        exportType.addEventListener('change', updateUI);
        updateUI(); // initialisation

        // Ouvrir le modal
        exportBtn.onclick = function() {
            modal.style.display = 'flex';
        };

        // Annuler
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
        };

        // Confirmer l'export
        confirmBtn.onclick = function() {
            const type = exportType.value;
            modal.style.display = 'none';

            getMapImage(function(canvas) {
                if (type === 'jpeg') {
                    // JPEG
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/jpeg', 0.95);
                    link.download = 'carte_export.jpg';
                    link.click();
                } 
                else if (type === 'pdf') {
                    // PDF (code existant)
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

                    pdf.output('dataurlnewwindow');
                    pdf.save(`carte_${formatVal}_${dpi}dpi.pdf`);
                } 
                else if (type === 'json') {
                    // ────────────────────────────────────────────────
                    // EXPORT JSON avec géométries + propriétés + styles
                    // ────────────────────────────────────────────────
                    const features = source.getFeatures();

                    const jsonData = {
                        type: "FeatureCollection",
                        name: "Carte dessinée",
                        crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } }, // projection par défaut (EPSG:4326)
                        features: features.map(feature => {
                            const geom = feature.getGeometry();
                            const props = feature.getProperties() || {};

                            // On nettoie les propriétés internes qu'on ne veut pas exporter
                            delete props.geometry;

                            // ────────────────────────────────────────────────
                            // Sauvegarde explicite des paramètres de style POLYGONE
                            // ────────────────────────────────────────────────
                            let polygonStyleConfig = null;

                            // if (geom && geom.getType() === 'Polygon') {
                            //     // On essaie de récupérer les valeurs depuis les propriétés
                            //     // ou depuis les variables globales actuelles si elles n'ont pas été stockées
                            //     polygonStyleConfig = {
                            //         strokeWidth: props.polyStrokeWidth || currentPolyStrokeWidth,
                            //         strokeColor: props.polyStrokeColor || currentPolyStrokeColor,
                            //         fillColor:   props.polyFill       || currentPolyFillColor
                            //     };
                            // }

                            if (geom && geom.getType() === 'Polygon') {
                                polygonStyleConfig = {
                                    strokeWidth: props.polyStrokeWidth || 2,
                                    strokeColor: props.polyStrokeColor || 'black',
                                    fillColor:   props.polyFill       || 'rgba(0,0,0,0.15)'
                                };
                            }

                            // Récupération du style appliqué (si défini)
                            let styleInfo = null;
                            const style = feature.getStyle();

                            if (style) {
                                // Cas où le style est une fonction → on l'appelle avec la feature pour obtenir le résultat
                                let computedStyle = style;
                                if (typeof style === 'function') {
                                    computedStyle = style(feature, map.getView().getResolution());
                                }

                                // computedStyle peut être un tableau ou un seul Style
                                const stylesArray = Array.isArray(computedStyle) ? computedStyle : [computedStyle];

                                // On prend le premier style pour simplifier (le plus courant)
                                const mainStyle = stylesArray[0];

                                if (mainStyle) {
                                    styleInfo = {};

                                    // Stroke (trait)
                                    const stroke = mainStyle.getStroke();
                                    if (stroke) {
                                        styleInfo.stroke = {
                                            color: stroke.getColor(),
                                            width: stroke.getWidth(),
                                            lineDash: stroke.getLineDash() || undefined,
                                            lineCap: stroke.getLineCap(),
                                            lineJoin: stroke.getLineJoin()
                                        };
                                    }

                                    // Fill (remplissage)
                                    const fill = mainStyle.getFill();
                                    if (fill) {
                                        styleInfo.fill = {
                                            color: fill.getColor()
                                        };
                                    }

                                    // Text (pour les annotations texte)
                                    const text = mainStyle.getText();
                                    if (text) {
                                        styleInfo.text = {
                                            content: text.getText(),
                                            font: text.getFont(),
                                            fillColor: text.getFill()?.getColor(),
                                            strokeColor: text.getStroke()?.getColor(),
                                            strokeWidth: text.getStroke()?.getWidth(),
                                            rotation: text.getRotation(),
                                            scale: text.getScale(),
                                            offsetX: text.getOffsetX(),
                                            offsetY: text.getOffsetY(),
                                            textAlign: text.getTextAlign(),
                                            textBaseline: text.getTextBaseline()
                                        };
                                    }

                                    // Icon (pour borne, nord, flèche, etc.)
                                    const image = mainStyle.getImage();
                                    if (image && image instanceof ol.style.Icon) {
                                        styleInfo.icon = {
                                            src: image.getSrc(),
                                            scale: image.getScale(),
                                            rotation: image.getRotation(),
                                            anchor: image.getAnchor()
                                        };
                                    }
                                }
                            }

                            return {
                                type: "Feature",
                                geometry: geom ? {
                                    type: geom.getType(),
                                    coordinates: geom.getCoordinates()
                                } : null,
                                properties: {
                                    ...props,
                                    // Ajout des configs spécifiques polygone
                                    polygonStyle: polygonStyleConfig || undefined,
                                    // On ajoute les styles calculés
                                    style: styleInfo || undefined
                                }
                            };
                        }).filter(f => f.geometry !== null)
                    };

                    jsonData.metadata = {
                        exportedAt: new Date().toISOString(),
                        center: map.getView().getCenter(),
                        zoom: map.getView().getZoom()
                    };

                    const jsonString = JSON.stringify(jsonData, null, 2);

                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'carte_vectorielle_' + new Date().toISOString().slice(0,10) + '.json';
                    document.body.appendChild(link);
                    link.click();

                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            });
        };

        // Fermer modal si clic en dehors
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
    // Gestion du bouton Importer + modal import

    document.addEventListener('DOMContentLoaded', function() {

        const importBtn = document.getElementById('importJSON');
        const importModal = document.getElementById('importModal');
        const cancelImportBtn = document.getElementById('cancelImport');
        const confirmImportBtn = document.getElementById('confirmImport');
        const fileInput = document.getElementById('jsonFileInput');

        if (!importBtn || !importModal) {
            console.warn("Éléments du modal d'importation introuvables");
            return;
        }

        // Ouvrir le modal
        importBtn.onclick = function() {
            importModal.style.display = 'flex';
            fileInput.value = ''; // reset champ fichier
        };

        // Annuler
        cancelImportBtn.onclick = function() {
            importModal.style.display = 'none';
            fileInput.value = '';
        };

        // Confirmer / Importer
        confirmImportBtn.onclick = function() {
            const file = fileInput.files[0];
            
            if (!file) {
                alert("Veuillez sélectionner un fichier JSON.");
                return;
            }

            if (!file.name.endsWith('.json')) {
                alert("Le fichier doit être au format .json");
                return;
            }

            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);

                    // Vider la carte actuelle (optionnel – à commenter si tu veux ajouter sans effacer)
                    source.clear();

                    // Importer les features
                    if (jsonData.type === "FeatureCollection" && Array.isArray(jsonData.features)) {
                        jsonData.features.forEach(feat => {

                            if (!feat.geometry || !feat.geometry.type || !feat.geometry.coordinates) { return; }

                            let geometry;
                            try {
                                geometry = new ol.geom[feat.geometry.type](feat.geometry.coordinates);
                            } catch (err) {
                                console.warn("Géométrie invalide ignorée :", feat.geometry.type);
                                return;
                            }

                            const feature = new ol.Feature({
                                geometry: geometry,
                                ...feat.properties
                            });

                            // Restaurer les propriétés spécifiques
                            if (feat.properties.isText) {
                                feature.set('isText', true);
                                feature.setStyle(createTextStyleFromFeature(feature));
                            }
                            else if (feat.properties.isArrow) {
                                feature.set('isArrow', true);
                            }
                            else if (feat.properties.isNord) {
                                feature.set('isNord', true);
                            }
                            else if (feat.geometry.type === 'Polygon' && feat.properties.polygonStyle) {
                                const ps = feat.properties.polygonStyle;

                                // On applique directement avec les valeurs du JSON
                                feature.setStyle(
                                    createPolygonStyle(
                                        ps.strokeWidth,
                                        ps.strokeColor,
                                        ps.fillColor
                                    )
                                );
                            }

                            // IMPORTANT : on NE touche PAS aux polygones ici
                            // On garde seulement le cas texte
                            if (feat.properties.style && feat.properties.style.text) {
                                feature.setStyle(createTextStyleFromFeature(feature));
                            }

                            source.addFeature(feature);
                        });

                        // Optionnel : recentrer la vue sur les données importées
                        if (jsonData.metadata && jsonData.metadata.center && jsonData.metadata.zoom) {
                            map.getView().setCenter(jsonData.metadata.center);
                            map.getView().setZoom(jsonData.metadata.zoom);
                        }

                        alert("Importation terminée avec succès !");
                    } else {
                        alert("Format JSON non reconnu (pas une FeatureCollection valide).");
                    }
                } catch (err) {
                    console.error("Erreur lors du parsing JSON :", err);
                    alert("Le fichier JSON est invalide ou corrompu.");
                }

                // Fermer le modal
                importModal.style.display = 'none';
                fileInput.value = '';
            };

            reader.onerror = function() {
                alert("Erreur lors de la lecture du fichier.");
            };

            reader.readAsText(file);
        };

        // Fermer modal si clic en dehors
        importModal.addEventListener('click', function(e) {
            if (e.target === importModal) {
                importModal.style.display = 'none';
                fileInput.value = '';
            }
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