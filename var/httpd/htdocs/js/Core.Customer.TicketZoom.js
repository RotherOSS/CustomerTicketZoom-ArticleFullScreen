// --
// OTOBO is a web-based ticketing system for service organisations.
// --
// Copyright (C) 2001-2020 OTRS AG, https://otrs.com/
// Copyright (C) 2019-2025 Rother OSS GmbH, https://otobo.io/
// --
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later version.
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.
// --
// $origin: otobo - cb7519b61706979a7ebe46a54a9d710b64427662 - var/httpd/htdocs/js/Core.Customer.TicketZoom.js
// --

"use strict";

var Core = Core || {};
Core.Customer = Core.Customer || {};

/**
 * @namespace Core.Customer.TicketZoom
 * @memberof Core.Customer
 * @author
 * @description
 *      This namespace contains all functions for CustomerTicketZoom.
 */
Core.Customer.TicketZoom = (function (TargetNS) {
    if (!Core.Debug.CheckDependency('Core.Customer', 'Core.UI.RichTextEditor', 'Core.UI.RichTextEditor')) {
        return false;
    }

    /**
     * @private
     * @name CalculateHeight
     * @memberof Core.Customer.TicketZoom
     * @function
     * @param {DOMObject} Iframe - DOM representation of an iframe
     * @description
     *      Sets the size of the iframe to the size of its inner html.
     */
    function CalculateHeight(Iframe){
        Iframe = isJQueryObject(Iframe) ? Iframe.get(0) : Iframe;

        setTimeout(function () {
            var $IframeContent = $(Iframe.contentDocument || Iframe.contentWindow.document),
                NewHeight = $IframeContent.height();
            if (!NewHeight || isNaN(NewHeight)) {
                NewHeight = 100;
            }
            else {
                if (NewHeight > 2500) {
                    NewHeight = 2500;
                }
            }

            NewHeight = parseInt(NewHeight, 10) + 25;
            $(Iframe).height(NewHeight + 'px');
        }, 1500);
    }

    /**
     * @private
     * @name CalculateHeight
     * @memberof Core.Customer.TicketZoom
     * @function
     * @param {DOMObject} Iframe - DOM representation of an iframe
     * @param {Function} [Callback]
     * @description
     *      Resizes Iframe to its max inner height and (optionally) calls callback.
     */
    function ResizeIframe(Iframe, Callback){
        Iframe = isJQueryObject(Iframe) ? Iframe.get(0) : Iframe;
        CalculateHeight(Iframe);
        if ($.isFunction(Callback)) {
            Callback();
        }
    }

    /**
     * @private
     * @name CheckIframe
     * @memberof Core.Customer.TicketZoom
     * @function
     * @param {DOMObject} Iframe - DOM representation of an iframe
     * @param {Function} [Callback]
     * @description
     *      This function contains some workarounds for all browsers to get re-size the iframe.
     * @see http://sonspring.com/journal/jquery-iframe-sizing
     */
    function CheckIframe(Iframe, Callback){
        var Source;

        Iframe = isJQueryObject(Iframe) ? Iframe.get(0) : Iframe;

        if ($.browser.safari || $.browser.opera){
            $(Iframe).on('load', function() {
                setTimeout(ResizeIframe, 0, Iframe, Callback);
            });
            Source = Iframe.src;
            Iframe.src = '';
            Iframe.src = Source;
        }
        else {
            $(Iframe).on('load', function() {
                ResizeIframe(this, Callback);
            });
        }
    }

    /**
     * @private
     * @name LoadMessage
     * @memberof Core.Customer.TicketZoom
     * @function
     * @param {jQueryObject} $Message
     * @description
     *      This function is called when an articles should be loaded. Our trick is, to hide the
     *      url of a containing iframe in the title attribute of the iframe so that it doesn't load
     *      immediately when the site loads. So we set the url in this function.
     */
    function LoadMessage($Message){
        var $SubjectHolder = $('h3 span', $Message),
            Subject = $SubjectHolder.text(),
            LoadingString = $SubjectHolder.attr('title'),
            $Iframe = $('iframe', $Message),
            Source = $Iframe.attr('title');

        /*  Change Subject to Loading */
        $SubjectHolder.text(LoadingString);

        /*  Load iframe -> get title and put it in src */
        if (Source !== 'about:blank') {
            $Iframe.attr('src', Source);
        }

        function Callback(){
            /*  Set data-articlestate to true and add class Visible */
            $Message.attr('data-articlestate', "true").addClass('Visible');

            /*  Change Subject back from Loading */
            $SubjectHolder.text(Subject).attr('title', Subject);
        }

        if ($Iframe.length) {
            CheckIframe($Iframe, Callback);
        }
        else {
            Callback();
        }
    }

    /**
     * @private
     * @name ToggleMessage
     * @memberof Core.Customer.TicketZoom
     * @function
     * @param {jQueryObject} $Message
     * @description
     *      This function checks the value of data-articlestate attribute containing the state of the article:
     *      untouched (= not yet loaded), true or false. If the article is already loaded (-> true), and
     *      user calls this function by clicking on the message head, the article gets hidden by removing
     *      the class 'Visible' and the status changes to false. If the message head is clicked while the
     *      status is false (e.g. the article is hidden), the article gets the class 'Visible' again and
     *      the status gets changed to true.
     */
    function ToggleMessage($Message){
        switch ($Message.attr('data-articlestate')) {
            case "untouched":
                LoadMessage($Message);
            break;
            case "true":
                $Message.removeClass('Visible');
                $Message.attr('data-articlestate', "false");
            break;
            case "false":
                $Message.addClass('Visible');
                $Message.attr('data-articlestate', "true");
            break;
        }
    }

    /**
     * @private
     * @name BuildArticles
     * @memberof Core.Customer.TicketZoom
     * @function
     * @description
     * This function activates attachments, replybutton, info, and builds the article list.
     */
    function BuildArticles(){
        $('#oooArticleListExpanded > li:not(.Activity):not(.EmptyMessage)').each( function() {
            var Article = $(this);
            var Header  = Article.children('.MessageHeader').first();

            // attachments
            var Attachments = $('.oooAttachments', Header);
            if ( Attachments.length ) {
                $('.oooAttButton', Header).on('click', function() {
                    Attachments.toggle();
                });
            }

            // info button
            var InfoBox = $('.oooInfoBox', Header);
            if ( InfoBox.length ) {
                $('.oooInfoButton', Header).on('click', function() {
                    InfoBox.toggle();
                });
            }

            // build TOC
            var TOCItem = Core.Template.Render('Customer/TicketZoomTOCItem', {
                Sender:  Header.children(".oooSender").first().text(),
                Age:     Header.find(".oooAge").first().text(),
                Subject: Header.children(".oooSubject").first().text(),
                Attach:  Attachments.length,
            });

// RotherOSS / CustomerTicketZoom-ArticleFullScreen

            // add Fullscreen Buttons here to avoid having to override MIMEBase.tt in this package.
            let $ArticleFooter = 
                '<div id="ArticleFooter">' +
                    '<button class="oooFullscreenButton">' +
                        '<svg class="oooStartFullscreenIcon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H7v-2c0-.55-.45-1-1-1zm0-4c.55 0 1-.45 1-1V7h2c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1zm11 7h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1v2zM14 6c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1z"/></svg>' +
                        '<svg class="oooStopFullscreenIcon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e3e3e3"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 16h2v2c0 .55.45 1 1 1s1-.45 1-1v-3c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1zm2-8H6c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1s-1 .45-1 1v2zm7 11c.55 0 1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1zm1-11V6c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1h-2z"/></svg>' +
                    '</button>' +
                '</div>';

            Article.append($ArticleFooter);

// EO CustomerTicketZoom-ArticleFullScreen
            
            // add Entry to list and make it scroll to the referenced article
            if ( navigator.userAgent.match(/Edge/) ) {
                $(TOCItem).on('click', function() {
                    $(window).scrollTop( $(Article[0]).offset().top - 89 );
                }).appendTo( $('#oooArticleList') );
            }
            else {
                $(TOCItem).on('click', function() {
                    $('html').animate( { scrollTop: $(Article[0]).offset().top - 89 }, 140 );
                }).appendTo( $('#oooArticleList') );
            }
        });

        $('#oooArticleList > li:first-child').addClass('oooActive');
    }

    /**
     * @name Init
     * @memberof Core.Customer.TicketZoom
     * @function
     * @description
     *      This function binds functions to the 'MessageHeader' and the 'Reply' button
     *      to toggle the visibility of the MessageBody and the reply form.
     *      Also it checks the iframes to re-size them to their full (inner) size
     *      and hides the quotes inside the iframes + adds an anchor to toggle the visibility of the quotes.
     *      Furthermore it execute field updates, add and remove of attachments.
     */
    TargetNS.Init = function(){
        var $VisibleIframe = $('.VisibleFrame'),
            $FollowUp = $('#FollowUp'),
            $RTE = $('#RichText'),
            ZoomExpand = $('#ZoomExpand').val(),
            $Form,
            FieldID,
            ActivityCount = $('#oooArticleListExpanded > .Activity').length;


        // otobo
        BuildArticles();
        $('#ReplyButton').on('click', function(Event){
            Event.preventDefault();

            // hide all open activities
            $('.Activity.Visible .CloseButton').trigger('click');

            $FollowUp.show();
            $FollowUp.addClass('Visible');
            Core.UI.InputFields.Activate();
            $('html').css({scrollTop: $('#Body').height()});
            Core.UI.RichTextEditor.Focus($RTE);
            if ( $(window).width() < 768 ) {
                $('#ReplyButton').hide();
            }
            // set the position of the RTE label (Core.UI.RichTextEditor.js)
            $(window).trigger('resize');

            //set correct initial size after show()
            let initialRTESize = window.getComputedStyle(document.querySelector(".RichTextHolder")).getPropertyValue("--RTE-init-size-large");
            $RTE.parent().css("height", initialRTESize);
        });

        $('.ActivityStartButton').on('click', function(Event){
            Event.preventDefault();
            var DialogEntityID = $(this).attr('id').replace( /^Button_/, '' ),
                $DialogWidget  = $( '#Process_' + DialogEntityID );

            // hide all open activities
            $('.Activity.Visible .CloseButton').trigger('click');

            $DialogWidget.show();
            $DialogWidget.addClass('Visible');
            Core.UI.InputFields.Activate();
            $('html').css({scrollTop: $('#Body').height()});
            // set the position of the RTE label (Core.UI.RichTextEditor.js)
            $(window).trigger('resize');

            if ( Core.Config.Get('HideActivatedActivityDialogButton') == '1' ) {
                // show all process dialog buttons
                $('.ActivityStartButton').show();

                // hide button which was clicked
                $(this).hide();
            }
        });

        $('.CloseButton').on('click', function(Event){
            Event.preventDefault();
            var ParentWidget = $(this).closest('li');
            ParentWidget.hide();
            ParentWidget.removeClass('Visible');
            $('html').css({scrollTop: $('#Body').height()});
            if ( ParentWidget.attr('id') === 'FollowUp' ) {
                $('#ReplyButton').show();
            }

            if ( Core.Config.Get('HideActivatedActivityDialogButton') == '1' ) {

                // show all process dialog buttons
                $('.ActivityStartButton').show();
            }
        });

        // scroll events
        if ( $('#oooArticleList > li').length ) {
            $(window).scroll( function() {
                // change Header on scroll
                if ( $(window).width() > 767 ) {
                    if ( $(window).scrollTop() > 90 && $("#oooHeader").height() > 56 ) {
                        $("#oooHeader").height( '56px' );
                        $("#oooHeader").css( 'padding-top', '8px' );
                        $("#oooHeader .oooCategory").fadeOut(200);
                    }
                    else if ( $(window).scrollTop() < 8 ) {
                        $("#oooHeader").height( '123px' );
                        $("#oooHeader").css( 'padding-top', '22px' );
                        $("#oooHeader .oooCategory").fadeIn(200);
                    }
                }

                // track active article
                var ActiveIndex = $('#oooArticleList > .oooActive').index() + 1 + ActivityCount,
                    StartIndex  = ActiveIndex,
                    ActiveChild = $('#oooArticleListExpanded > li:nth-child(' + ActiveIndex + ')');

                if ( ActiveChild.length ) {
                    $('#oooArticleList > .oooActive').removeClass('oooActive');

                    // scroll down
                    if ( ActiveChild.offset().top < $(window).scrollTop() + 240 ) {
                        var NextChild = $('#oooArticleListExpanded > li:nth-child(' + ( ActiveIndex + 1 ) + ')');
                        while ( NextChild.length && NextChild.offset().top < $(window).scrollTop() + 240 ) {
                            ActiveChild = NextChild;
                            ActiveIndex++;
                            NextChild = $('#oooArticleListExpanded > li:nth-child(' + ( ActiveIndex + 1 ) + ')');
                        }
                    }
                    // scroll up
                    else {
                        $('#oooArticleList > .oooActive').removeClass('oooActive');
                        var PrevChild = $('#oooArticleListExpanded > li:nth-child(' + ( ActiveIndex - 1 ) + ')');
                        while ( ActiveIndex > 1 + ActivityCount && ActiveChild.offset().top > $(window).scrollTop() + 240) {
                            ActiveChild = PrevChild;
                            ActiveIndex--;
                            PrevChild = $('#oooArticleListExpanded > li:nth-child(' + ( ActiveIndex - 1 ) + ')');
                        }
                    }
                    $('#oooArticleList > li:nth-child(' + ( ActiveIndex - ActivityCount ) +')').addClass('oooActive');
                    if ( ActiveIndex !== StartIndex ) {
                        $('#oooArticleList').scrollTop( $('#oooArticleList > .oooActive').position().top );
                    }
                }
            });
        }

        // TODO: connect to scrollevent
        $('#oooArticleListExpanded .MessageBody').each( function() {
            LoadMessage($(this));
        });

        // info button toggle info on click
        $('#oooHeader .oooInfo').on('click', function() {
            if ( $(window).width() > 519 ) {
                $('#oooTicketInfo').css({top: 80, right: 40}).toggle();
            }
            else {
                $('#oooTicketInfo').css({top: 0, left: 0}).toggle();
            }
        });

        // more button toggle further actions on click
        $('#oooHeader .ooofo-more_v').on('click', function() {
            if ( $(window).width() > 519 ) {
                $('#oooMore').css({top: 80, right: 40}).toggle();
            }
            else {
                $('#oooMore').css({top: 0, left: 0}).toggle();
            }
        });

        // eo otobo

        /*        $('#Messages > li > .MessageHeader').on('click', function(Event){
            ToggleMessage($(this).parent());
            Event.preventDefault();
        });*/
        /* Set statuses saved in the hidden fields for all visible messages if ZoomExpand is present */
        if ( $VisibleIframe.length ) {
            if (!ZoomExpand || isNaN(ZoomExpand)) {
                $('#Messages > li').attr('data-articlestate', "true");
                ResizeIframe($VisibleIframe);
            }
            else {
                /* Set statuses saved in the hidden fields for all messages */
                $('#Messages > li:not(:last)').attr('data-articlestate', "untouched");
                $('#Messages > li:last').attr('data-articlestate', "true");
                ResizeIframe($VisibleIframe.get(0));
            }
        }

        // init browser link message close button
        if ($('.MessageBrowser').length) {
            $('.MessageBrowser a.Close').on('click', function () {
                var Data = {
                    Action: 'CustomerTicketZoom',
                    Subaction: 'BrowserLinkMessage',
                    TicketID: $('input[name=TicketID]').val()
                };

                $('.MessageBrowser').fadeOut("slow");

                // call server, to save that the bo was closed and do not show it again on reload
                Core.AJAX.FunctionCall(
                    Core.Config.Get('CGIHandle'),
                    Data,
                    function () {}
                );

                return false;
            });
        }

        /*
         * If on document load there are Error classes present, there were validation errors on server side.
         * Open the respective activity dialogs..
         */
        var $ServerErrors = $('input.ServerError, textarea.ServerError, select.ServerError');

        if ($ServerErrors.length) {
            var $DialogWidget = $ServerErrors.first().closest('li.Activity');
            $DialogWidget.show();
            $DialogWidget.addClass('Visible');
            Core.UI.InputFields.Activate();
        }

        $('a.AsPopup').on('click', function () {
            Core.UI.Popup.OpenPopup($(this).attr('href'), 'TicketAction');
            return false;
        });

        /*
         * Set neccessary CSS values for TicketInfo
         */
        if ( $('#oooArticleList').children().length == 0 ) {
            $('#oooTicketInfo.oooTicketInfoPermanent').css('margin-top', '0px').css('top', 'revert').css('max-height', 'revert');
        }

// RotherOSS / CustomerTicketZoom-ArticleFullScreen

        /*
         * add onclick for triggering article fullscreen
         */
        $('#oooArticleListExpanded li .oooFullscreenButton').on('click', function() {
            let $Article = $(this).closest('li');
            $Article.toggleClass('oooFullscreenActive');
            let $Iframe = $('iframe', $Article);

            /* set iframe height minimal to allow for correct resizing, otherwise the body grows with the iframe and 
            will not be resized properly when toggling off fullscreen view. */
            $Iframe.height('0');
            
            ResizeIframe($Iframe);
        });

// EO CustomerTicketZoom-ArticleFullScreen

    };

    Core.Init.RegisterNamespace(TargetNS, 'APP_MODULE');

    return TargetNS;
}(Core.Customer.TicketZoom || {}));
