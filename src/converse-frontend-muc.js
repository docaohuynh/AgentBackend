// Converse.js (A browser based XMPP chat client)
// http://conversejs.org
//
// Copyright (c) 2012-2016, Jan-Carel Brand <jc@opkode.com>
// Licensed under the Mozilla Public License (MPLv2)
//
/*global Backbone, define, window */

/* This is a Converse.js plugin which add support for multi-user chat rooms, as
 * specified in XEP-0045 Multi-user chat.
 */
(function (root, factory) {
    define("converse-frontend-muc", [
            "converse-core",
            "converse-api",
            "typeahead",
            "converse-chatview"
    ], factory);
}(this, function (converse, converse_api) {
    "use strict";
    // Strophe methods for building stanzas
    var Strophe = converse_api.env.Strophe,
        $iq = converse_api.env.$iq,
        $build = converse_api.env.$build,
        $msg = converse_api.env.$msg,
        $pres = converse_api.env.$pres,
        b64_sha1 = converse_api.env.b64_sha1,
        utils = converse_api.env.utils;
    // Other necessary globals
    var $ = converse_api.env.jQuery,
        _ = converse_api.env._,
        moment = converse_api.env.moment;

    // For translations
    var __ = utils.__.bind(converse);
    var ___ = utils.___;

    converse_api.plugins.add('converse-frontend-muc', {
        /* Optional dependencies are other plugins which might be
         * overridden or relied upon, if they exist, otherwise they're ignored.
         *
         * However, if the setting "strict_plugin_dependencies" is set to true,
         * an error will be raised if the plugin is not found.
         *
         * NB: These plugins need to have already been loaded via require.js.
         */
        optional_dependencies: ["converse-controlbox"],

        overrides: {
            // Overrides mentioned here will be picked up by converse.js's
            // plugin architecture they will replace existing methods on the
            // relevant objects or classes.
            //
            // New functions which don't exist yet can also be added.

            ControlBoxView: {
                createRoomSuccess: function(iq){
                    var converse = this._super.converse;
                    // var from = iq.getAttribute('from');
                    // var jid = $(iq).attr('from');
                    var jid = iq+converse.sky_room;
                    // var newArgs = [];
                    // for (int i = 1; i < arguments.length; i++) {
                    //     newArgs.push(arguments[i]);
                    // }
                    // newArgs.push(jid);
                    // this._super.createRoomSuccess.apply(this, newArgs);

                    // var jid = "01656132662-1468743355173@muc.skyb";
                    var newArgs = [];
                    // for (int i = 1; i < arguments.length; i++) {
                    //     newArgs.push(arguments[i]);
                    // }
                    newArgs.push(jid);
                    this._super.createRoomSuccess.apply(this, newArgs);

                },
                createRoomFail: function(error){
                    converse.log("[HUYNHDC]create room fail" );
                },
                onConnected: function () {
                    // TODO: This can probably be refactored to be an event
                    // handler (and therefore removed from overrides)
                    // converse.log('[HUYNHDC create IQ room ]');
                    var converse = this._super.converse;
                    this._super.onConnected.apply(this, arguments);
                    $('#conversejs').hide();
                    //
                    // var infoUser = JSON.stringify({"uid":Strophe.getNodeFromJid(converse.connection.jid)});
                    // //post data to
                    // var that = this;
                    // var xhr = new XMLHttpRequest();
                    // var url = converse.sky_apiserver+"webclient/allroom";
                    // xhr.open("POST", url, true);
                    // xhr.onreadystatechange = function () {
                    //     if (xhr.readyState == 4 && xhr.status == 200) {
                    //         var json = JSON.parse(xhr.responseText);
                    //         if(json.room.length == 0){
                    //             //create room default create
                    //             that.updateContact("defaultroom");
                    //         }else{
                    //
                    //         }
                    //     }
                    // }

                    // $('#toggle-controlbox').css("display", "none");
                    // $('#controlbox').css("display", "none");
                    // this.createRoomSuccess();
                    // $('#toggle-controlbox').hide();

                }
            }

        },

        initialize: function () {
            /* The initialize function gets called as soon as the plugin is
             * loaded by converse.js's plugin machinery.
             */
            var converse = this.converse;
            // Configuration values for this plugin
        }
    });
}));
