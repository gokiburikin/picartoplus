// ==UserScript==
// @name        picarto+
// @namespace   https://picarto.tv/*
// @include     https://picarto.tv/*
// @description Improvements to Picarto
// @version     0.0.1
// @grant       none
// @downloadURL https://github.com/gokiburikin/picartoplus/raw/master/picartoplus.user.js
// ==/UserScript==
// TODO: Just run the command when clicking sound buttons

// User preferences
/* Most of these settings are meant to be edited using the commands while in google hangouts.
To access a list of commands, enter the command !? into the chat. */

var picartoPlus = {};

// Keeps track of the most up to date version of the script
picartoPlus.scriptVersion = "0.0.1";

function initializeVariables()
{
	/* It's not suggested that you actually change anything here. Use the script commands to make changes
	to the data stored here instead. */

	picartoPlus.scrollingFix = true;
}

// * Do not edit below this line * //

// Saves the preferences to local storage
function savePreferences()
{
	try
	{
		if (localStorageTest())
		{
			localStorage.setItem('scriptVersion', JSON.stringify(picartoPlus.scriptVersion));
			localStorage.setItem('scrollingFix', JSON.stringify(picartoPlus.scrollingFix));

		}
	}
	catch (exception)
	{
		console.log("[picarto+]: Failed to save preferences.");
	}
}

// Attempt to find and parse a user preference. If it fails, use the default value.
function tryLoadPreference(preference, defaultValue)
{
	var output = defaultValue;
	if (localStorage.getItem(preference))
	{
		output = JSON.parse(localStorage.getItem(preference));
	}
	return output;
}

// Loads the preferences from local storage, if they exist
function loadPreferences()
{
	try
	{
		var results = '';
		if (localStorageTest())
		{
			// 1.43 is for the first version that the scriptVersion was introduced
			picartoPlus.currentVersion = tryLoadPreference('scriptVersion', "0.0.1");
			picartoPlus.scrollingFix = tryLoadPreference('scrollingFix', true);

			results = ' Loaded picarto+.';
		}
		else
		{
			picartoPlus.currentVersion = "0.0.0";
		}
	}
	catch (exception)
	{
		console.log("[picarto+]: Failed to load preferences: " + exception.message);
	}
}


// Clears the preferences from local storage
function clearPreferences()
{
	localStorage.removeItem('scriptVersion');
	localStorage.removeItem('scrollingFix');
}

function migrate(currentVersion, scriptVersion)
{
	addSystemMessage('No migration.');
}

// Test if localstorage is available
// From http://modernizr.com/
function localStorageTest()
{
	var test = 'test';
	try
	{
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	}
	catch (e)
	{
		return false;
	}
}

// Returns a new element that replicates the hangouts system message
function newChatLineSystemMessage(message)
{
	var listEntry = document.createElement('li');
	listEntry.className = "messageli um-picarto+";
	listEntry.style.display = "list-item";

	var infoContent = document.createElement("div");
	infoContent.className = "infoContent";
	infoContent.style.backgroundColor = "#09F";

	var usernameSpan = document.createElement("span");
	usernameSpan.className = "msgUsername";
	usernameSpan.style.color = "#FFF";
	usernameSpan.title = "The plugin cannot be whispered.";

	var usernameSpanContent = document.createTextNode("picarto+");

	var messageSpan = document.createElement("span");
	messageSpan.className = "theMsg usermsg";

	var messageSpanContent = document.createTextNode(message);

	messageSpan.appendChild(messageSpanContent);
	usernameSpan.appendChild(usernameSpanContent);
	infoContent.appendChild(usernameSpan);
	infoContent.appendChild(messageSpan);
	listEntry.appendChild(infoContent);
	return listEntry;
}

// Used to add false system messages to the chat area
function addSystemMessage(message)
{
	var div = newChatLineSystemMessage(message);
	if (picartoPlus.chat)
	{
		var messageList = document.querySelector('#msgs');
		console.log(messageList);
		messageList.appendChild(div);
		scrollChatToBottom();
	}
	return div;
}

// If the scroll fix is enabled and the user has scrolled, keep the scroll bar in place
/* Hangouts always scrolls the chat to the maximum when a new message arrives. This is called after 
the mutation observer so that after hangouts scrolls to the bottom, this scrolls back up to where it
was. */
function scrollFix()
{
	if (picartoPlus.scrollingFix)
	{
		scrollChatToBottom();
		if (picartoPlus.fixedScrolling)
		{
			picartoPlus.chat.scrollTop = picartoPlus.fixedScrollingPosition;
		}
	}
}

// Scrolls the chat to the very bottom
function scrollChatToBottom()
{
	picartoPlus.chat.scrollTop = picartoPlus.chat.scrollHeight - picartoPlus.chat.clientHeight;
}

// Checks if the chat is scrolled to the bottom
function isChatScrolledToBottom()
{
	var isAtBottom = false;
	var difference = Math.abs(picartoPlus.chat.scrollTop - (picartoPlus.chat.scrollHeight - picartoPlus.chat.clientHeight));

	if (difference < picartoPlus.scrollAtBottomThreshold)
	{
		isAtBottom = true;
	}
	return isAtBottom;
}

// Returns the outcome of a regex test
function regexMatch(text, pattern)
{
	var regex = new RegExp(pattern);
	return regex.test(text);
}

// The chat mutation observer
/* This watches for any children added to the main chat area div. Based on what it is, it will parse
the message to purge, highlight, or play sounds. Blacklisted messages are not added to the chat area when 
purgemode is enabled. */

var chatObserver = new MutationObserver(function (mutations)
{
	mutations.forEach(function (mutation)
	{
		// For each mutation to the chat window
		for (var i = 0; i < mutation.addedNodes.length; i++)
		{
			var node = mutation.addedNodes[i];

			// Ensure the mutation has not be nulled
			if (node)
			{
				// Kc-Va-m is the avatar container class
				if (node.childNodes[0] && node.childNodes[0].childNodes[0] && node.childNodes[0].childNodes[0].classList.contains('Kc-Va-m'))
				{
					node.avatarContainer = node.childNodes[0].childNodes[0];
				}
				if (node.childNodes[0] && node.childNodes[0].childNodes[1])
				{
					if (node.childNodes[0].childNodes[1].childNodes[0] && node.childNodes[0].childNodes[1].childNodes[0].childNodes[0])
					{
						node.senderContainer = node.childNodes[0].childNodes[1].childNodes[0].childNodes[0];
					}
					if (node.childNodes[0].childNodes[1].childNodes[1])
					{
						node.messageContainer = node.childNodes[0].childNodes[1].childNodes[1];
					}
				}

				// Kc-we is the message DIV containing everything about an individual user's consecutive messages
				// If the node is Kc-we, then start tracking observing it for consecutive messages and disconnect the previous observer
				// See lastMessageObserver
				if (node.classList.contains('Kc-we'))
				{
					lastMessageNode = node;
					lastMessageObserver.disconnect();
					if (lastMessageNode && lastMessageNode.firstChild && lastMessageNode.firstChild.childNodes.length > 0 && lastMessageNode.firstChild.childNodes[1])
					{
						lastMessageObserver.observe(lastMessageNode.firstChild.childNodes[1],
						{
							attributes: true,
							childList: true,
							characterData: true
						});
					}
					newMessageMutationHandler(node);
				}

			}
		}
		scrollFix();
	});
});

// The last message mutation observer
/* This must be used in order to capture and alter messages sent by the same person in succession,
as the top level mutation observer will not capture changes to its children.

Mutation edit handling has been separated into two functions.

This function is what is called when a user speaks without being interrupted by another message.*/
var lastMessageObserver = new MutationObserver(function (mutations)
{
	mutations.forEach(function (mutation)
	{
		for (var i = 0; i < mutation.addedNodes.length; i++)
		{
			var node = mutation.addedNodes[i];
			// The handleNewMessage functions contains edits that can be done even if it's not the first time a user speaks
			node.messageContainer = node;
			node.senderContainer = lastMessageNode.senderContainer;
			handleNewMessage(node);
		}
		scrollFix();
	});
});

/* This function is what is called when a user speaks for the first time since another user or message type
has been received. Aliases, name colour, and removal of avatars happens here. */
var newMessageMutationHandler = function (node)
{
	handleNewMessage(node);
}

var consecutiveMessageMutationHandler = function (node)
{
	handleNewMessage(node);
}

// Handles new messages
function handleNewMessage(node)
{
	scrollFix();
}

// The big list of commands
function performCommand(command)
{
	// Commands command
	if (command[0] === '!?')
	{
		var commands = [
			'scrollingFix [on/off]',
		];
		for (var i = 0; i < commands.length; i++)
		{
			addSystemMessage('!' + commands[i]);
		}
	}
	// Scrolling Fix command
	else if (command[0] === '!scrollingFix')
	{
		simpleToggleCommand(command, "scrollingFix", [
			"Scrolling Fix now enabled.",
			"Scrolling Fix now disabled.",
			"Scrolling Fix is enabled.",
			"Scrolling Fix is disabled."
		]);
	}
	else
	{
		addSystemMessage('Invalid command.');
	}
	savePreferences();
}

function simpleToggleCommand(command, variable, messages)
{
	if (command[1] === 'on')
	{
		picartoPlus[variable] = true;
		addSystemMessage(messages[0]);
	}
	else if (command[1] === 'off')
	{
		picartoPlus[variable] = false;
		addSystemMessage(messages[1]);
	}
	else
	{
		if (picartoPlus[variable] == true)
		{
			addSystemMessage(messages[2]);
		}
		else
		{
			addSystemMessage(messages[3]);
		}
	}
}

function simulate(target, evtName)
{
	evt = document.createEvent("MouseEvents");
	evt.initMouseEvent(evtName, true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, target);
	target.dispatchEvent(evt);
}

function simulateClick(target)
{
	simulate(target, "mouseover");
	simulate(target, "mousedown");
	simulate(target, "mouseup");
	simulate(target, "mouseout");
}

// The main observer used to load and intialize the script
var picartoObserver = new MutationObserver(function (mutations)
{
	// Chat initialization
	if (!picartoPlus.chatInit)
	{
		picartoPlus.chat = document.querySelector('#chatContainer');
		if (picartoPlus.chat && chatObserver)
		{
			chatObserver.observe(picartoPlus.chat,
			{
				attributes: true,
				childList: true,
				characterData: true
			});
			picartoPlus.chat.onscroll = function ()
			{
				if (picartoPlus.scrollingFix)
				{
					picartoPlus.textArea.placeholder = 'Enter chat message or link here';
					if (!isChatScrolledToBottom())
					{
						picartoPlus.fixedScrolling = true;
						picartoPlus.fixedScrollingPosition = picartoPlus.chat.scrollTop;
						picartoPlus.textArea.placeholder = 'The chat is scrolled up';
					}
					else
					{
						picartoPlus.fixedScrolling = false;
					}
				}
			}
			picartoPlus.chatInit = true;
		}
	}

	// Text area initialization
	if (!picartoPlus.textAreaInit)
	{
		picartoPlus.textArea = document.querySelector('.input');
		if (picartoPlus.textArea)
		{
			$(picartoPlus.textArea)[0].addEventListener('keydown', function (event)
			{
				if (event.shiftKey)
				{
					if (event.which == 13)
					{
						picartoPlus.textArea.value = picartoPlus.textArea.value + "\n";
						event.useCapture = true;
						event.preventDefault();
						event.stopPropagation();
						return false;
					}
				}
				else if (event.which == 13)
				{
					if (picartoPlus.textArea.value[0] === '!')
					{
						var command = picartoPlus.textArea.value.split(' ');
						picartoPlus.textArea.value = '';
						performCommand(command);
						return false;
					}
				}

			}, true);
			picartoPlus.textAreaInit = true;
		}
	}

	if (picartoPlus.textAreaInit)
	{
		if (!picartoPlus.preferencesInit)
		{
			loadPreferences();
			picartoPlus.preferencesInit = true;
		}
	}

	if (picartoPlus.chatInit && picartoPlus.textAreaInit)
	{
		// Focus the text area when the window becomes focused
		$(window).focus(function ()
		{
			if (picartoPlus.focusChatFromBlur)
			{
				picartoPlus.textArea.focus();
			}
		});
		var audio = new Audio("https://dl.dropboxusercontent.com/u/12577282/cnd/success.wav");
		audio.play();
		picartoObserver.disconnect();
		addSystemMessage('Plugin initialized. v' + picartoPlus.scriptVersion + '. Type !? for a list of commands.');
	}
});
initializeVariables();
picartoObserver.disconnect();
picartoObserver.observe(document.querySelector('body'),
{
	attributes: true,
	childList: true,
	characterData: true
});

// Variable initialization

// The version stored in user preferences
picartoPlus.currentVersion = 0.00;

// Tracks if the preferences have been loaded
picartoPlus.preferencesInit = false;

// Tracks if the chat was properly initialized
picartoPlus.chatInit = false;

// Tracks if the commands were properly initialized
picartoPlus.textAreaInit = false;

// Tracks if the user has manually scrolled the scrollbar
/* There is currently an issue where this is set to true outside of normal conditions */
picartoPlus.fixedScrolling = false;

// Keeps track of where the scrollbar is
picartoPlus.fixedScrollingPosition = 0;

// The actual chat area div
picartoPlus.chat;

// The text area used to send chat messages
picartoPlus.textArea;

// The node of the last received chat message
/* This is used as a mutation observer object because hangouts does not make a new div in the main chat
window when the same user posts multiple messages before another user or system message is received */
picartoPlus.lastMessageNode;

// The amount of distance between the bottom of the scrollbar and the scroll position that can be assumed at the bottom
picartoPlus.scrollAtBottomThreshold = 20;