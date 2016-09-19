// Converse.js (A browser based XMPP chat client)
// http://conversejs.org
//
// Copyright (c) 2012-2016, Jan-Carel Brand <jc@opkode.com>
// Licensed under the Mozilla Public License (MPLv2)
//
/*global Backbone, define */

(function (root, factory) {
    define("converse-contactview", ["converse-core", "converse-api"], factory);
}(this, function (converse, converse_api) {
    "use strict";
    var $ = converse_api.env.jQuery,
        utils = converse_api.env.utils,
        $build = converse_api.env.$build,
        Strophe = converse_api.env.Strophe,
        $iq = converse_api.env.$iq,
        b64_sha1 = converse_api.env.b64_sha1,
        _ = converse_api.env._,
        __ = utils.__.bind(converse);

    var STATUSES = {
        'dnd': __('This contact is busy'),
        'online': __('This contact is online'),
        'offline': __('This contact is offline'),
        'unavailable': __('This contact is unavailable'),
        'xa': __('This contact is away for an extended period'),
        'away': __('This contact is away')
    };
    var LABEL_CONTACTS = __('Contacts');
    var LABEL_GROUPS = __('Groups');
    var HEADER_CURRENT_CONTACTS =  __('My contacts');
    var HEADER_PENDING_CONTACTS = __('Pending contacts');
    var HEADER_REQUESTING_CONTACTS = __('Contact requests');
    var HEADER_UNGROUPED = __('Ungrouped');
    var HEADER_WEIGHTS = {};
    HEADER_WEIGHTS[HEADER_REQUESTING_CONTACTS] = 0;
    HEADER_WEIGHTS[HEADER_CURRENT_CONTACTS]    = 1;
    HEADER_WEIGHTS[HEADER_UNGROUPED]           = 2;
    HEADER_WEIGHTS[HEADER_PENDING_CONTACTS]    = 3;

    converse_api.plugins.add('contactview', {

        overrides: {
            // Overrides mentioned here will be picked up by converse.js's
            // plugin architecture they will replace existing methods on the
            // relevant objects or classes.
            //
            // New functions which don't exist yet can also be added.

            afterReconnected: function () {
                this.rosterview.registerRosterXHandler();
                this._super.afterReconnected.apply(this, arguments);
            },
            ChatBoxes: {
                onConnected: function (chatbox) {
                    this._super.onConnected.apply(this, arguments);
                    converse.rosterviewmessenger = new converse.RosterViewMessenger({model: converse.rostermessenger});
                    // converse.rosterviewmessenger.render().fetch().update();
                    converse.rosterviewmessenger.render().fetch();
                }
            },
        },


        initialize: function () {
            /* The initialize function gets called as soon as the plugin is
             * loaded by converse.js's plugin machinery.
             */
            this.updateSettings({
                allow_chat_pending_contacts: false,
                allow_contact_removal: true,
                show_toolbar: true,
            });

            converse.RosterViewMessenger = Backbone.Overview.extend({
                tagName: 'div',
                className: 'tab-content tab-child-content-contact',
                // id: 'chat_list',

                initialize: function () {
                    this.roster_handler_ref = this.registerRosterHandler();
                    this.rosterx_handler_ref = this.registerRosterXHandler();
                    converse.rostermessenger.on("add", this.onContactAdd, this);
                    converse.rostermessenger.on('change', this.onContactChange, this);
                    converse.rostermessenger.on("destroy", this.update, this);
                    converse.rostermessenger.on("remove", this.update, this);

                    var that = this;
                    setInterval(function(){ that.customerStatus(); }, 10*1000);
                    // this.model.on("add", this.onGroupAdd, this);
                    // this.model.on("reset", this.reset, this);
                },
                events: {
                    "change": "contactViewChange"
                },

                render: function () {
                    $('.tab-content-contact').append(this.$el);
                    this.$el.append('<div class="tab-pane" id="chat_list"></div>')
                            .append('<div class="tab-pane active" id="chat_request"></div>');
                    // this.$el.html(this.filter_view.render());
                    // if (!converse.allow_contact_requests) {
                    //     // XXX: if we ever support live editing of config then
                    //     // we'll need to be able to remove this class on the fly.
                    //     this.$el.addClass('no-contact-requests');
                    // }
                    return this;
                },
                customerStatus: function(){
                    var contactString = "";
                    converse.rostermessenger.each(function (item, index, all) {
                        var idUser = item.get('user_id');
                        converse.log("INDEX " + idUser);
                        contactString += '{"user":"'+idUser+'"},';
                    });
                    contactString = "["+contactString.substr(0, contactString.length -1)+"]";
                    // var infoUser = JSON.stringify(contactString);
                    var xhr = new XMLHttpRequest();
                    var url = converse.sky_apiserver+"webclient/customerstatus";
                    xhr.open("POST", url, true);
                    xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
                    var that = this;
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            var json = JSON.parse(xhr.responseText);
                            if(json.code == 200){
                                var msgJson = json.users;
                                if(msgJson.length == 0){
                                    return this;
                                }
                                _.each(msgJson, function(msgJ){
                                    converse.log(msgJ.user);
                                    converse.log(msgJ.status);
                                    that.updateStatusCustomer(msgJ.user, msgJ.status);
                                });
                            }else{
                                return this;
                            }
                        }
                    }
                    xhr.send(contactString);
                    
                },
                updateStatusCustomer: function(user, status){
                    user = user+converse.sky_room;
                    var modelContact = converse.rostermessenger.get(user);
                    modelContact.set("status",status);
                },
                contactViewChange: function(){
                    console.log("[HUYNHDC] contact change");
                },
                updateFilter: _.debounce(function () {
                    /* Filter the roster again.
                     * Called whenever the filter settings have been changed or
                     * when contacts have been added, removed or changed.
                     *
                     * Debounced so that it doesn't get called for every
                     * contact fetched from browser storage.
                     */
                    var type = this.filter_view.model.get('filter_type');
                    if (type === 'state') {
                        this.filter(this.filter_view.model.get('chat_state'), type);
                    } else {
                        this.filter(this.filter_view.model.get('filter_text'), type);
                    }
                }, 100),

                unregisterHandlers: function () {
                    converse.connection.deleteHandler(this.roster_handler_ref);
                    delete this.roster_handler_ref;
                    converse.connection.deleteHandler(this.rosterx_handler_ref);
                    delete this.rosterx_handler_ref;
                },

                update: _.debounce(function () {
                    if (this.$roster.parent().length === 0) {
                        this.$el.append(this.$roster.show());
                    }
                    return this.showHideFilter();
                }, converse.animate ? 100 : 0),

                showHideFilter: function () {
                    if (!this.$el.is(':visible')) {
                        return;
                    }
                    if (this.$roster.hasScrollBar()) {
                        this.filter_view.show();
                    } else if (!this.filter_view.isActive()) {
                        this.filter_view.hide();
                    }
                    return this;
                },

                fetch: function () {
                    converse.rostermessenger.fetchFromServer();
                    return this;
                },

                filter: function (query, type) {
                    // First we make sure the filter is restored to its
                    // original state
                    _.each(this.getAll(), function (view) {
                        if (view.model.contacts.length > 0) {
                            view.show().filter('');
                        }
                    });
                    // Now we can filter
                    query = query.toLowerCase();
                    if (type === 'groups') {
                        _.each(this.getAll(), function (view, idx) {
                            if (view.model.get('name').toLowerCase().indexOf(query.toLowerCase()) === -1) {
                                view.hide();
                            } else if (view.model.contacts.length > 0) {
                                view.show();
                            }
                        });
                    } else {
                        _.each(this.getAll(), function (view) {
                            view.filter(query, type);
                        });
                    }
                },

                reset: function () {
                    converse.roster.reset();
                    this.removeAll();
                    this.$roster = $('<dl class="roster-contacts" style="display: none;"></dl>');
                    this.render().update();
                    return this;
                },

                registerRosterHandler: function () {
                    converse.connection.addHandler(
                        converse.roster.onRosterPush.bind(converse.roster),
                        Strophe.NS.ROSTER, 'iq', "set"
                    );
                },

                registerRosterXHandler: function () {
                    var t = 0;
                    converse.connection.addHandler(
                        function (msg) {
                            window.setTimeout(
                                function () {
                                    converse.connection.flush();
                                    converse.roster.subscribeToSuggestedItems.bind(converse.roster)(msg);
                                },
                                t
                            );
                            t += $(msg).find('item').length*250;
                            return true;
                        },
                        Strophe.NS.ROSTERX, 'message', null
                    );
                },


                onGroupAdd: function (group) {
                    var view = new converse.RosterGroupView({model: group});
                    this.add(group.get('name'), view.render());
                    this.positionGroup(view);
                },

                onContactAdd: function (contact) {
                    var view = new converse.RosterContactViewMessenger({model: contact});
                    if(contact.get('is_pick') == 'true'){
                        $('#chat_list').prepend(view.$el);
                        view.render();
                        view.$el.find('.pickup-chat').hide();
                    }else{
                        $('#chat_request').prepend(view.$el);
                        view.render();
                        $('.mideas-list-request-count').html($("#chat_request").children("p").size());
                    }
                    return this;
                },

                onContactChange: function (contact) {
                    if(contact.get('status') == 0){
                        this.$el.find('.open-image[data-msgid="contact_'+contact.get('jid')+'"]').removeClass("text-muted").addClass("text-green");
                    }else{
                        this.$el.find('.open-image[data-msgid="contact_'+contact.get('jid')+'"]').removeClass("text-green").addClass("text-muted");
                    }

                    //have new unread message
                    if(contact.get('num_unread') > 0){
                        this.$el.find('.open-image[data-msgid="contact_'+contact.get('jid')+'"]').addClass("unread-contact");
                    }else{
                        this.$el.find('.open-image[data-msgid="contact_'+contact.get('jid')+'"]').removeClass("unread-contact");
                    }
                   
                    // this.updateChatBox(contact).update();
                    // if (_.has(contact.changed, 'subscription')) {
                    //     if (contact.changed.subscription === 'from') {
                    //         this.addContactToGroup(contact, HEADER_PENDING_CONTACTS);
                    //     } else if (_.contains(['both', 'to'], contact.get('subscription'))) {
                    //         this.addExistingContact(contact);
                    //     }
                    // }
                    // if (_.has(contact.changed, 'ask') && contact.changed.ask === 'subscribe') {
                    //     this.addContactToGroup(contact, HEADER_PENDING_CONTACTS);
                    // }
                    // if (_.has(contact.changed, 'subscription') && contact.changed.requesting === 'true') {
                    //     this.addContactToGroup(contact, HEADER_REQUESTING_CONTACTS);
                    // }
                    // this.updateFilter();
                },

                updateChatBox: function (contact) {
                    var chatbox = converse.chatboxes.get(contact.get('jid')),
                        changes = {};
                    if (!chatbox) {
                        return this;
                    }
                    if (_.has(contact.changed, 'chat_status')) {
                        changes.chat_status = contact.get('chat_status');
                    }
                    if (_.has(contact.changed, 'status')) {
                        changes.status = contact.get('status');
                    }
                    chatbox.save(changes);
                    return this;
                },

                positionFetchedGroups: function (model, resp, options) {
                    /* Instead of throwing an add event for each group
                     * fetched, we wait until they're all fetched and then
                     * we position them.
                     * Works around the problem of positionGroup not
                     * working when all groups besides the one being
                     * positioned aren't already in inserted into the
                     * roster DOM element.
                     */
                    model.sort();
                    model.each(function (group, idx) {
                        var view = this.get(group.get('name'));
                        if (!view) {
                            view = new converse.RosterGroupView({model: group});
                            this.add(group.get('name'), view.render());
                        }
                        if (idx === 0) {
                            this.$roster.append(view.$el);
                        } else {
                            this.appendGroup(view);
                        }
                    }.bind(this));
                },

                positionGroup: function (view) {
                    /* Place the group's DOM element in the correct alphabetical
                     * position amongst the other groups in the roster.
                     */
                    var $groups = this.$roster.find('.roster-group'),
                        index = $groups.length ? this.model.indexOf(view.model) : 0;
                    if (index === 0) {
                        this.$roster.prepend(view.$el);
                    } else if (index === (this.model.length-1)) {
                        this.appendGroup(view);
                    } else {
                        $($groups.eq(index)).before(view.$el);
                    }
                    return this;
                },

                appendGroup: function (view) {
                    /* Add the group at the bottom of the roster
                     */
                    var $last = this.$roster.find('.roster-group').last();
                    var $siblings = $last.siblings('dd');
                    if ($siblings.length > 0) {
                        $siblings.last().after(view.$el);
                    } else {
                        $last.after(view.$el);
                    }
                    return this;
                },

                getGroup: function (name) {
                    /* Returns the group as specified by name.
                     * Creates the group if it doesn't exist.
                     */
                    var view =  this.get(name);
                    if (view) {
                        return view.model;
                    }
                    return this.model.create({name: name, id: b64_sha1(name)});
                },

                addContactToGroup: function (contact, name) {
                    this.getGroup(name).contacts.add(contact);
                },

                addExistingContact: function (contact) {
                    var groups;
                    if (converse.roster_groups) {
                        groups = contact.get('groups');
                        if (groups.length === 0) {
                            groups = [HEADER_UNGROUPED];
                        }
                    } else {
                        groups = [HEADER_CURRENT_CONTACTS];
                    }
                    _.each(groups, _.bind(this.addContactToGroup, this, contact));
                },

                addRosterContact: function (contact) {
                    this.addExistingContact(contact);
                    return this;
                }
            });


            converse.RosterContactViewMessenger = Backbone.View.extend({
                tagName: 'p',
                className: 'open-chat contact-item-mideas',

                events: {
                    "click .accept-xmpp-request": "acceptRequest",
                    "click .decline-xmpp-request": "declineRequest",
                    "click .open-chat": "openChat",
                    "click": "openChat",
                    "click .pickup-chat": "pickupChat",
                    "click .remove-xmpp-contact": "removeContact"
                },

                initialize: function () {
                    // this.model.on("change", this.render, this);
                    this.model.on("remove", this.remove, this);
                    this.model.on("destroy", this.remove, this);
                    this.model.on("open", this.openChat, this);


                },

                render: function () {
                    var item = this.model;
                    this.$el.html(converse.templates.contact_item(this.model.toJSON()));
                    return this;
                },

                isGroupCollapsed: function () {
                    /* Check whether the group in which this contact appears is
                     * collapsed.
                     */
                    // XXX: this sucks and is fragile.
                    // It's because I tried to do the "right thing"
                    // and use definition lists to represent roster groups.
                    // If roster group items were inside the group elements, we
                    // would simplify things by not having to check whether the
                    // group is collapsed or not.
                    var name = this.$el.prevAll('dt:first').data('group');
                    var group = converse.rosterview.model.where({'name': name})[0];
                    if (group.get('state') === converse.CLOSED) {
                        return true;
                    }
                    return false;
                },

                mayBeShown: function () {
                    /* Return a boolean indicating whether this contact should
                     * generally be visible in the roster.
                     *
                     * It doesn't check for the more specific case of whether
                     * the group it's in is collapsed (see isGroupCollapsed).
                     */
                    var chatStatus = this.model.get('chat_status');
                    if ((converse.show_only_online_users && chatStatus !== 'online') ||
                        (converse.hide_offline_users && chatStatus === 'offline')) {
                        // If pending or requesting, show
                        if ((this.model.get('ask') === 'subscribe') ||
                                (this.model.get('subscription') === 'from') ||
                                (this.model.get('requesting') === true)) {
                            return true;
                        }
                        return false;
                    }
                    return true;
                },

                openChat: function (ev) {
                    if (ev && ev.preventDefault) { ev.preventDefault(); }
                    var jid = this.model.attributes.jid;
                    var is_pick = this.model.attributes.is_pick;
                    var item = _.extend(this.model.toJSON(), {
                            name: jid,
                            nick: jid,
                            type: 'chatroom',
                            is_pick: is_pick,
                            is_click: 'true',
                            box_id: b64_sha1(jid)
                        }
                    );
                    //call function
                    try {
                        converse.log("INFO CUSTOMER EEEEEEEEEEEEEEEEEEE ");
                        var uid = Strophe.getNodeFromJid(jid);
                        var user = uid.substr(0, uid.length - 14 );
                        $('.chat-textarea').val("");
                        customer_chat.infoChat(user);
                        customer_chat.customerInfo(user);
                        
                    }
                    catch(err) {
                        converse.log(err);
                    }
                    this.focusContactClick(item);
                    converse.chatboxviewsmessenger.closeAllChatBoxesHide();
                    return converse.chatboxviewsmessenger.showChat(item);
                },
                pickupChat: function (ev) {
                    if (ev && ev.preventDefault) { ev.preventDefault(); }
                    var jid = this.model.attributes.jid;
                    var room = Strophe.getNodeFromJid(jid);

                    var item = $build("member", {jid: Strophe.getNodeFromJid(converse.connection.jid), role: "member"});
                    var iq = $iq({to: room+converse.sky_room, type: "set", id: Math.random().toString(36).substr(2, 6)})
                        .c("query", {xmlns: "kickweb"})
                        .cnode(item.node).up();
                    converse.connection.sendIQ(iq, this.pickUpSuccess.bind(this), this.pickUpFail.bind(this));
                    return this;
                },
                pickUpSuccess: function(iq){
                    converse.log("picksuccess");
                    this.$el.find('.pickup-chat').hide();
                    $('#mideas-list-contact').click();
                    $('#chat_list').prepend(this.$el);
                    converse.chatboxviewsmessenger.get(this.model.attributes.jid).$chattextarea.prop("disabled",false);
                    this.model.attributes.is_pick = "true";
                    $('.mideas-list-request-count').html($("#chat_request").children("p").size());
                },
                pickUpFail: function(iq){

                },
                focusContactClick: function(contact){
                    var id = contact.name;
                    converse.rostermessenger.each(function (item, index, all) {
                        var roomName = item.get('id');
                        if(roomName == id){  //focus this
                            converse.rostermessenger.get(roomName).save('is_focus', true);
                        }else{  //unfocus all
                            converse.rostermessenger.get(roomName).save('is_focus', false);
                        }
                    });
                    this.model.save('num_unread', 0 );
                },
                removeContact: function (ev) {
                    if (ev && ev.preventDefault) { ev.preventDefault(); }
                    if (!converse.allow_contact_removal) { return; }
                    var result = confirm(__("Are you sure you want to remove this contact?"));
                    if (result === true) {
                        var iq = $iq({type: 'set'})
                            .c('query', {xmlns: Strophe.NS.ROSTER})
                            .c('item', {jid: this.model.get('jid'), subscription: "remove"});
                        converse.connection.sendIQ(iq,
                            function (iq) {
                                this.model.destroy();
                                this.remove();
                            }.bind(this),
                            function (err) {
                                alert(__("Sorry, there was an error while trying to remove "+name+" as a contact."));
                                converse.log(err);
                            }
                        );
                    }
                },

                acceptRequest: function (ev) {
                    if (ev && ev.preventDefault) { ev.preventDefault(); }
                    converse.roster.sendContactAddIQ(
                        this.model.get('jid'),
                        this.model.get('fullname'),
                        [],
                        function () { this.model.authorize().subscribe(); }.bind(this)
                    );
                },

                declineRequest: function (ev) {
                    if (ev && ev.preventDefault) { ev.preventDefault(); }
                    var result = confirm(__("Are you sure you want to decline this contact request?"));
                    if (result === true) {
                        this.model.unauthorize().destroy();
                    }
                    return this;
                }
            });



        }
    });
}));
