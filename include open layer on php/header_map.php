<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-topo</title>
    <link rel="shortcut icon" type="image/png" href="<?php echo base_url(); ?>/assets/Image/favicon.png" />
    <link href="<?php echo base_url(); ?>/assets/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>/assets/mdi/css/materialdesignicons.min.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>/assets/styles.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>/assets/style_default.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>/assets/treeview.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>/assets/fontawesome-free-6.6.0-web/css/all.min.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>assets/open-layer/open-layer.css" rel="stylesheet" />
    <link href="<?php echo base_url(); ?>/assets/hint.min.css" rel="stylesheet">
    <script src="<?php echo base_url(); ?>assets/open-layer/open-layer.js" type="text/javascript"></script>
    <script src="<?php echo base_url(); ?>assets/open-layer/proj/projs.js" type="text/javascript"></script>
    <script src="<?php echo base_url(); ?>assets/open-layer/layerSwitcher.js" type="text/javascript"></script>
    <script src="<?php echo base_url(); ?>/assets/jquery-3.4.1.min.js"></script>
    <script src="<?php echo base_url(); ?>/assets/scripts.js"></script>
    <script src="<?php echo base_url(); ?>/assets/sweetalert2@11.js"></script>
    <style>
        /* Style de base pour le popup */
        .popup {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 1100;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        /* Popup pour les succès */
        .popup-success {
            background-color: #28a745;
            /* Vert */
        }

        /* Popup pour les erreurs */
        .popup-error {
            background-color: #dc3545;
            /* Rouge */
        }

        /* Bouton de fermeture */
        .close-btn {
            background: none;
            border: none;
            font-size: 20px;
            color: white;
            cursor: pointer;
        }

        .legend {
            display: flex;
            flex-wrap: wrap; /* Permet de passer à la ligne si nécessaire */
            align-items: center;
            gap: 1px;
            /* Espacement entre les images */
        }

        /* Sur les écrans larges : ne pas wrap */
        @media (min-width: 992px) {
            .legend {
                flex-wrap: nowrap;
                justify-content: flex-start;
            }
        }

        .main {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        .cube {
            width: 13px;
            height: 13px;
            background-color: white;
            cursor: pointer;
            margin-left: 25px;
            margin-top: 2px;
        }

        footer {
            background-color: #ffffff;
            color: #0f3659;
            text-align: center;
            padding: 10px 0;
            box-shadow: inset -1px 0px 13px 0px #e9ecef;
        }
    </style>
</head>