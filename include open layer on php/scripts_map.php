<!-- </div> -->
<div class="toast-container position-absolute bottom-0 end-0 p-3" id="notification-alert">
    <!-- Notification alert -->
</div>

<!-- Modal email -->
<div class="modal fade" id="ModalEmailSend" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-bottom-right m-2 modal-email-dialog">
        <form id="form_send_email">
            <input type="hidden" name="iddossier" value="<?php echo $iddossier ?>">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Envoyer Mail</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row border-bottom pb-3" style="align-items: baseline;">
                        <div class="col-1">À: </div>
                        <div class="col-11">
                            <div class="row">
                                <div class="col-12">
                                    <div class="d-flex flex-wrap" id="usage_email">

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row border-bottom pt-3 pb-3" style="align-items: baseline;">
                        <div class="col-1"><label for="subject-mail">Sujet:</label></div>
                        <div class="col-11">
                            <input type="text" name="subject-email" id="subject-mail" class="input-personaliser"
                                placeholder="Sujet du l'information">
                        </div>
                    </div>
                    <div class="row mt-2">
                        <textarea class="textarea-personnaliser" name="object-email"
                            placeholder="Entrez votre message ici..." name="" cols="30" rows="10"></textarea>
                    </div>
                </div>
                <div class="border-top p-3">
                    <div class="row">
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary">
                                Envoyer
                            </button>
                        </div>
                        <div class="col-6" style="text-align: end;">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                <i class="fa-solid fa-trash" style="font-size:13px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>


<!-- Footer -->
<!-- <footer class="header d-flex justify-content-between align-items-center py-3"
                style="background-color:#ffffff ;">
                <span>Copyright © 2024 DST.</span>
                <span>DST : Direction des Services Topographiques</span>
            </footer> -->
<!-- Fin Footer -->
<footer class=" text-center py-3 mt-auto">
    <span>© 2025 DST : Direction des Services Topographiques. Tous droits réservés.</span>
</footer>
</div>
</div>

<script src="<?php echo base_url(); ?>/assets/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?php echo base_url(); ?>/assets/turf.min.js"></script>
<script src="<?php echo base_url(); ?>/assets/scripts.js"></script>
<script src="<?php echo base_url(); ?>/assets/main_leaflet.js" type="text/javascript"></script>
<script src="<?php echo base_url(); ?>/assets/map-search.js" type="text/javascript"></script>
<script src="<?php echo base_url(); ?>/assets/script.js"></script>
</body>

</html>