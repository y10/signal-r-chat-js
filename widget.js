/*****************************************************************************
Copyright(c) 2018 Serhiy Voytenko
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE
****************************************************************************/
// chat widget
(function ($, module)
{
    function notify(title, message)
    {
        function createNotification()
        {
            var n = new Notification(title, {
                body: message,
                icon: module.resolveUrl('./chat-button.png'),
                vibrate: [100, 50, 100]
            });

            bounce();

            setTimeout(function ()
            {
                n.close();

            }, 5000);

            return n;
        }

        // Let's check if the browser supports notifications
        if (!("Notification" in window))
        {
            module.log("This browser does not support system notifications");

            return;
        }

        // Let's check whether notification permissions have already been granted
        else if (Notification.permission === "granted")
        {
            createNotification();
        }

        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== 'denied')
        {
            Notification.requestPermission(function (permission)
            {
                // If the user accepts, let's create a notification
                if (permission === "granted")
                {
                    createNotification();
                }
            });
        }
    }

    function bounce()
    {
        $("#chat-button").effect("bounce");
    }
    
    function intitializeUI(chat)
    {
        chat.refresh = function ()
        {
            refresh()
        }

        function sendMessage()
        {
            var reciepient = $("#chat-recipient-select option:selected").val();

            if (reciepient && reciepient != "*")
            {
                chat.server.sendMessage(reciepient, $("#chat-message-text").val());
            }
            else
            {
                chat.server.sendAll($("#chat-message-text").val());
            }

            $("#chat-message-text").val(null);

            closeChatWindow();
        }

        function closeChatWindow()
        {
            $("#chat-widget, #chat-overlay").removeClass("active");
        }

        function toggleChatWindow()
        {
            $("#chat-widget, #chat-overlay").toggleClass("active");
        }

        function showChatWindow()
        {
            $("#chat-message-text").focus();
        }

        function refresh()
        {
            var selectedUserId = $("#chat-recipient-select option:selected").val();

            var $dropdown = $("#chat-recipient-select");

            $dropdown.find('option').remove().end();

            $dropdown.append($("<option />").val("").text("All"));

            $.each(chat.activeUsers, function ()
            {
                if (!chat.currentUser || chat.currentUser.Id != this.Id)
                {
                    var option = $("<option />").val(this.Id).text(this.DisplayName);

                    if (this.Id == selectedUserId)
                    {
                        option.attr("selected", "selected");
                    }

                    $dropdown.append(option);
                }

            });

            if (chat.activeUsers && chat.activeUsers.length > 1)
            {
                $("#chat-button").removeAttr("disabled").effect("bounce");
            }
            else
            {
                $("#chat-button").attr("disabled", "disabled");

                if (selectedUserId != $("#chat-recipient-select option:selected").val())
                {
                    closeChatWindow();
                }
            }
        }

        $("#chat-button")
            .fadeIn();

        $("#chat-widget")
            .draggable();

        $("#chat-button, #chat-overlay, #chat-window-close, #chat-send-button").click(function ()
        {
            toggleChatWindow();
        });

        $("#chat-button").click(function ()
        {
            showChatWindow();
        });

        $("#chat-send-button").click(function ()
        {
            sendMessage();
        });

        $("#chat-message-text").keyup(function (e)
        {
            if (e.ctrlKey && e.keyCode == 13)
            {
                sendMessage();
            }
            else if (e.keyCode == 27)
            {
                closeChatWindow();
            }
        });

        $("#btnSignOut, #panelT_toolsBar_menuuserName_item_0").on("click", function ()
        {
            $.connection.hub.stop();
        });

        refresh();
    }

    function intitialize()
    {
        var chat = $.connection.chatHub;

        chat.refresh = function () { /* implement later */ };

        chat.client.receiveMessage = function (name, message)
        {
            module.log("New message '" + message + "'");

            notify("New message from " + name, message);
        };

        chat.client.activeUsers = function (data)
        {
            chat.activeUsers = data;

            chat.refresh();

            module.log("Active users changed");
        };

        $.connection.hub.start().done(function ()
        {
            chat.server.getActiveUsers().done(function (users)
            {

                chat.server.getCurrentUser().done(function (user)
                {
                    chat.currentUser = user;

                    intitializeUI(chat);

                    module.log("Current user loaded");
                });

                chat.activeUsers = users;

                module.log("Active users loaded");
            });

            bounce();

            module.log("Chat connection created");
        });

        module.log("document loaded");
    }

    intitialize();

})(jQuery, jQuery.chatModule);

//# sourceURL=chat-widget.js