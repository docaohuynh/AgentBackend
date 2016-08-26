define("converse-templates", [
    "tpl!action",
    "tpl!add_contact_dropdown",
    "tpl!add_contact_form",
    "tpl!change_status_message",
    "tpl!chat_status",
    "tpl!chatarea",
    "tpl!chatbox",
    "tpl!chatroom",
    "tpl!chatroom_form",
    "tpl!chatroom_password_form",
    "tpl!chatroom_sidebar",
    "tpl!chatrooms_tab",
    "tpl!chats_panel",
    "tpl!choose_status",
    "tpl!contacts_panel",
    "tpl!contacts_tab",
    "tpl!controlbox",
    "tpl!controlbox_toggle",
    "tpl!field",
    "tpl!form_captcha",
    "tpl!form_checkbox",
    "tpl!form_input",
    "tpl!form_select",
    "tpl!form_textarea",
    "tpl!form_username",
    "tpl!group_header",
    "tpl!info",
    "tpl!login_panel",
    "tpl!login_tab",
    "tpl!message",
    "tpl!new_day",
    "tpl!occupant",
    "tpl!pending_contact",
    "tpl!pending_contacts",
    "tpl!register_panel",
    "tpl!register_tab",
    "tpl!registration_form",
    "tpl!registration_request",
    "tpl!requesting_contact",
    "tpl!requesting_contacts",
    "tpl!room_description",
    "tpl!room_item",
    "tpl!room_panel",
    "tpl!roster",
    "tpl!roster_item",
    "tpl!search_contact",
    "tpl!select_option",
    "tpl!status_option",
    "tpl!toggle_chats",
    "tpl!toolbar",
    "tpl!toolbar_otr",
    "tpl!trimmed_chat",
    "tpl!vcard",

    // Can be removed together with converse-minimize.js
    // if minimization/trimming features not needed (for example for mobile
    // apps).
    "tpl!chatbox_minimize",
    "tpl!messenger_left_menu",
    "tpl!messenger_right_chat",
    "tpl!contact_item",
    "tpl!contact_search",
    "tpl!chatbox_messenger",
    "tpl!chatbox_message",
    "tpl!chatbox_message_me",
    "tpl!contact_info"
], function () {
    return {
        action:                 arguments[0],
        add_contact_dropdown:   arguments[1],
        add_contact_form:       arguments[2],
        change_status_message:  arguments[3],
        chat_status:            arguments[4],
        chatarea:               arguments[5],
        chatbox:                arguments[6],
        chatroom:               arguments[7],
        chatroom_form:          arguments[8],
        chatroom_password_form: arguments[9],
        chatroom_sidebar:       arguments[10],
        chatrooms_tab:          arguments[11],
        chats_panel:            arguments[12],
        choose_status:          arguments[13],
        contacts_panel:         arguments[14],
        contacts_tab:           arguments[15],
        controlbox:             arguments[16],
        controlbox_toggle:      arguments[17],
        field:                  arguments[18],
        form_captcha:           arguments[19],
        form_checkbox:          arguments[20],
        form_input:             arguments[21],
        form_select:            arguments[22],
        form_textarea:          arguments[23],
        form_username:          arguments[24],
        group_header:           arguments[25],
        info:                   arguments[26],
        login_panel:            arguments[27],
        login_tab:              arguments[28],
        message:                arguments[29],
        new_day:                arguments[30],
        occupant:               arguments[31],
        pending_contact:        arguments[32],
        pending_contacts:       arguments[33],
        register_panel:         arguments[34],
        register_tab:           arguments[35],
        registration_form:      arguments[36],
        registration_request:   arguments[37],
        requesting_contact:     arguments[38],
        requesting_contacts:    arguments[39],
        room_description:       arguments[40],
        room_item:              arguments[41],
        room_panel:             arguments[42],
        roster:                 arguments[43],
        roster_item:            arguments[44],
        search_contact:         arguments[45],
        select_option:          arguments[46],
        status_option:          arguments[47],
        toggle_chats:           arguments[48],
        toolbar:                arguments[49],
        toolbar_otr:            arguments[50],
        trimmed_chat:           arguments[51],
        vcard:                  arguments[52],
        chatbox_minimize:       arguments[53],
        messenger_left_menu:    arguments[54],
        messenger_right_chat:   arguments[55],
        contact_item:           arguments[56],
        contact_search:         arguments[57],
        chatbox_messenger:      arguments[58],
        chatbox_message:        arguments[59],
        chatbox_message_me:     arguments[60],
        contact_info:     arguments[61]
    };
});
