var TAG = TAG || {};

TAG.Auth = (function () {
    "use strict";
    if (!TAG.AuthOverlay) {
        var overlay = generateOverlay();
        TAG.AuthOverlay = overlay.overlay;
        TAG.AuthSubmit = overlay.submit;
        TAG.AuthCancel = overlay.cancel;
        TAG.AuthInput = overlay.input;
        TAG.AuthError = overlay.error;
        TAG.AuthCircle = overlay.circle;
        var successFunction;
        var passwordDialogBox;
        
    }

    return {
        getToken: getToken,
        clearToken: clearToken,
        authenticate: authenticate,
        hashPass: hashPass,
        checkPassword: checkPassword,
        changePassword: changePassword,
    };

    

    /*function submitOnClick() {   // store the authoring mode password submit button's on click function
                TAG.AuthError.hide();
                TAG.AuthCircle.show();
                TAG.AuthSubmit.hide();
                TAG.AuthCancel.hide();
                checkPassword(TAG.AuthInput.val(), function () {
                    TAG.AuthError.hide();
                    TAG.AuthCircle.hide();
                    TAG.AuthOverlay.remove();
                    successFunction();
                }, function () {
                    TAG.AuthError.html('Invalid Password. Please try again...');
                    TAG.AuthError.show();
                    TAG.AuthCircle.hide();
                    TAG.AuthSubmit.show();
                    TAG.AuthCancel.show();
                }, function () {
                    TAG.AuthError.html('There was an error contacting the server. Contact a server administrator if this error persists.');
                    TAG.AuthError.show();
                    TAG.AuthError.css({'bottom': '30%'});
                    TAG.AuthCircle.hide();
                    TAG.AuthSubmit.show();
                    TAG.AuthCancel.show();
                });
            } */


    function getToken() {
        return TAG.AuthToken || null;
    }

    function clearToken() {
        TAG.Worktop.Database.clearToken(TAG.AuthToken);
        TAG.AuthToken = null;
    }

    function hashPass(passwd, salt) {
        var string = passwd + salt;
        var hash = CryptoJS.SHA256(string);
        for (var i = 0; i < 1023; i++) {
            hash = CryptoJS.SHA256(hash);
        }
        return hash;
    }

    function checkPassword(passwd, onSuccess, onFail, onError) {
        TAG.Worktop.Database.getSalt(function (salt) {
            TAG.Worktop.Database.getAuth(passwd, salt,
                function (token) {
                    TAG.AuthToken = token;
                    onSuccess();
                },
                onFail,
                onError);
        }, onError);
    }

    function changePassword(oldpass, newpass, onSuccess, onFail, onError) {
        if (!checkValidPassword(newpass)) {
            onFail('Password must contain at least 8 characters with 3 of the following types:<br>Lowercase letter<br>Uppercase letter<br>Number<br>Symbol');
            return;
        }
        TAG.Worktop.Database.getSalt(function (salt) {
            TAG.Worktop.Database.changePass(oldpass, salt, newpass,
                function (token) {
                    TAG.AuthToken = token;
                    onSuccess();
                },
                onFail,
                onError);
        });
    }

    function checkValidPassword(pass) {
        if (pass && pass.length >= 8) {
            var matches = 0;
            if (pass.match(/(?=.*[a-z])/)) {
                matches++;
            }
            if (pass.match(/(?=.*[A-Z])/)) {
                matches++;
            }
            if (pass.match(/(?=.*[\d])/)) {
                matches++;
            }
            if (pass.match(/(?=.*[\W])/)) {
                matches++;
            }
            if (matches >= 3) {
                return true;
            }
        }
        return false;
    }

  

    function authenticate(onSuccess, onCancel) {
        successFunction = onSuccess;
        if (TAG.AuthToken) {
            TAG.Worktop.Database.checkToken(TAG.AuthToken, onSuccess, showForm, showForm);
        } else { 
            showForm(); 
        }
        function showForm() {
            $("#tagRoot").append(TAG.AuthOverlay);
            TAG.AuthInput.val('');
            TAG.AuthOverlay.fadeIn(500);
            TAG.AuthInput.focus();
            TAG.AuthSubmit.show();
            TAG.AuthCancel.show();
            TAG.AuthCancel.click(function () {
                TAG.AuthError.hide();
                TAG.AuthCircle.hide();
                TAG.AuthOverlay.fadeOut(500, function () {
                    TAG.AuthOverlay.remove();
                    if (onCancel) {
                        onCancel();
                    }
                });
            });

        

            TAG.AuthSubmit.click(function () {
                
                TAG.AuthError.hide();
                TAG.AuthCircle.show();
                TAG.AuthSubmit.hide();
                TAG.AuthCancel.hide();
                checkPassword(TAG.AuthInput.val(), function () {
                    TAG.AuthError.hide();
                    TAG.AuthCircle.hide();
                    TAG.AuthOverlay.remove();
                    onSuccess();
                }, function () {
                    TAG.AuthError.html('Invalid Password. Please try again...');
                    TAG.AuthError.show();
                    TAG.AuthCircle.hide();
                    TAG.AuthSubmit.show();
                    TAG.AuthCancel.show();
                }, function () {
                    TAG.AuthError.html('There was an error contacting the server. Contact a server administrator if this error persists.');
                    TAG.AuthError.show();
                    TAG.AuthError.css({'bottom': '30%'});
                    TAG.AuthCircle.hide();
                    TAG.AuthSubmit.show();
                    TAG.AuthCancel.show();
                });
            });
            
            //Enter can be pressed to submit the password form...
            TAG.AuthInput.keypress(function(e){

                if (e.which===13) {  // enter key press
                    
                    TAG.AuthError.hide();
                    TAG.AuthCircle.show();
                    TAG.AuthSubmit.hide();
                    TAG.AuthCancel.hide();
                    checkPassword(TAG.AuthInput.val(), function () {
                        TAG.AuthError.hide();
                        TAG.AuthCircle.hide();
                        TAG.AuthOverlay.remove();
                        onSuccess();
                
                    }, function () {
                
                    TAG.AuthError.html('Invalid Password. Please try again...');
                    TAG.AuthError.show();
                    TAG.AuthCircle.hide();
                    TAG.AuthSubmit.show();
                    TAG.AuthCancel.show();
                
                   }, function () {
               
                    TAG.AuthError.html('There was an error contacting the server. Contact a server administrator if this error persists.');
                    TAG.AuthError.show();
                    TAG.AuthError.css({'bottom': '30%'});
                    TAG.AuthCircle.hide();
                    TAG.AuthSubmit.show();
                    TAG.AuthCancel.show();
                  
                    });
                }
            });
        }
    }


    function generateOverlay(onSuccess, onCancel) {
       

        var overlay = $(document.createElement('div'));
        overlay.attr('id', 'loginOverlay');
        var loginDialog = $(document.createElement('div'));
        loginDialog.attr('id', 'loginDialog');

        passwordDialogBox = loginDialog;


        overlay.css({
            display: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'background-color': 'rgba(0,0,0,0.6)',
            'z-index': 100000002,
        });


        ///

        var loginDialogSpecs = TAG.Util.constrainAndPosition($(window).width(), $(window).height(),

        {
            center_h: true,
            center_v: true,
            width: 0.5,
            height: 0.35,
            max_width: 560,
            max_height: 210,
        });

        loginDialog.css({
            position: 'absolute',
            top: loginDialogSpecs.y + 'px',
            width: loginDialogSpecs.width-200 + 'px',
            height: loginDialogSpecs.height - 55+ 'px',
            left: loginDialogSpecs.x + 'px',
            border: '3px double white',
            'background-color': 'black',
        });
        
        ///


        //loginDialog.css({
        //    position: 'absolute',
        //    left: '34%',
        //    width: 'auto',
        //    top: '30%',
        //    border: '3px double white',
        //    'background-color': 'black',
        //    'padding': '2.5% 2.5%',
        //});
        overlay.append(loginDialog); 
        var dialogTitle = $(document.createElement('div'));
        dialogTitle.attr('id', 'dialogTitle');
        dialogTitle.css({

            color: 'white',
            'width': '80%',
            'height': '15%',
            'left': '10%',
            'top': '12.5%',
            'font-size': '50%',
            //'font-size': '1.25em',
            'position': 'relative',
            'text-align': 'center',
            //'overflow': 'hidden',
        });
        dialogTitle.text('Please enter authoring mode password.');

        var passwdInput = $(document.createElement('input'));
        passwdInput.attr({
            type: 'password',
            id: 'password',
            name: 'password',
            placeholder: 'password',
        });
        passwdInput.css({
            display: 'block',
            'position':'relative',
            margin: 'auto',
            'margin-top': '8%',
            'margin-bottom': '4%'
        });



        var errorMessage = $(document.createElement('div'));
        errorMessage.attr('id', 'errorMessage');
        errorMessage.css({
            color: 'white',
            //'font-size': '1.25em',
            'margin-bottom': '10px',
            'left': '10%',
            'width': '80%',
            'font-size': '50%',
            'text-align': 'center',
            'bottom': '25%',
            'position': 'absolute',
        });
        errorMessage.html('Invalid Password. Please try again...'); //<br/>Please contact <a href="mailto:brown.touchartgallery@gmail.com">brown.touchartgallery@gmail.com</a> for password.');
        errorMessage.hide();

        var buttonRow = $(document.createElement('div'));
        buttonRow.css({
            //'margin-top': '10px',
            'position': 'relative',
            'display': 'block',
            'width': '70%',
            'left': '10%',
            'bottom': '-6%'
        });
        var submitButton = $(document.createElement('button'));
        submitButton.css({
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'margin-left': '-7%',
            'display': 'inline-block',
        });
        var circle = $(document.createElement('img'));
        circle.css({
            'width': '20px',
            'height': 'auto',
            'display': 'none',
            'margin-right': '3%',
            'margin-top': '2.5%',
            'float': 'right'
        });
        circle.attr('src', tagPath+'images/icons/progress-circle.gif');


        submitButton.text('Submit');
        
        var authFailed = function () {
            errorMessage.show();
            circle.hide();
        };
        var submit = function () {
            errorMessage.hide();
            circle.show();
        };

        var cancelButton = $(document.createElement('button'));
        cancelButton.attr('type', 'button');
        cancelButton.css({
            'border': '1px solid white',
            'width': 'auto',
            'position': 'relative',
            'margin-top': '1%',
            'float': "right",
            'margin-right': '-21%',
            'display': 'inline-block',
    });
        cancelButton.text('Cancel');
        loginDialog.append(dialogTitle);
        loginDialog.append(passwdInput);
        loginDialog.append(errorMessage);
        loginDialog.append(buttonRow);
        buttonRow.append(cancelButton);
        buttonRow.append(submitButton);
        buttonRow.append(circle);

        return {
            overlay: overlay,
            input: passwdInput,
            submit: submitButton,
            cancel: cancelButton,
            error: errorMessage,
            circle: circle
        };
    }
})();