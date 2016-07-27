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
    define("converse-frontend", [
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

    converse_api.plugins.add('converse-frontend', {
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
                onConnected: function () {
                    // TODO: This can probably be refactored to be an event
                    // handler (and therefore removed from overrides)
                    var converse = this._super.converse;
                    this._super.onConnected.apply(this, arguments);
                    var agent = converse.sky_agent;
                    var bare_jid = Strophe.getBareJidFromJid(agent);
                    var resource = Strophe.getBareJidFromJid(agent);
                    var node = Strophe.getNodeFromJid(agent);
                    var attributes = _.extend({
                        'id': bare_jid,
                        'jid': bare_jid,
                        'fullname': 'Hỗ trợ',
                        'chat_status': 'online',
                        'user_id': node,
                        'resources': resource ? [resource] : [],
                        'groups': [],
                        'image_type': 'image/png',
                        'image': "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",
                        'status': 'Tôi có thể giúp gì cho bạn'
                    }, {});
                    var model = new converse.RosterContact(attributes);
                    converse.chatboxviews.showChat(model.attributes);

                    converse.log('[HUYNHDC] [converese frontend] onconnected controlbox:' + $('#toggle-controlbox').html());
                    $('#toggle-controlbox').hide();

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
