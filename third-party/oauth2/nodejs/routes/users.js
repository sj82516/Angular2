/*
 返回成功資料格式
 res.json({
    code: 1,
    status: 'valid',
    content: content
 })
 content: {
    msg:msg,
    data:{
        user
    }
 }
 返回失敗資料格式
 res.json({
    code: 0,
    status: 'Invalid',
    content: {
        err: err
    }
 });
 */

var express = require('express');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var router = express.Router();
let request = require('request');

let github_client_id="122e6fca6cf86e0b42f2";
let github_secret_id="f4351001e06b431688df85c46221eb10265b0adf";
//回傳OAUTH Server請求網址，由瀏覽器重新導向
router.get('/github', function(req, res){
    if (req.user.isLogin) {
        returnSuccessCode({
            msg: 'AlreadyLogin',
            data: {
                user: {
                    isLogin: true,
                    id: user.id
                }
            }
        }, res);
        return;
    }
    let github_oauth_url = "https://github.com/login/oauth/authorize" +
        "?client_id=" + github_client_id  +
        "&scope=user";
    res.json({'redirect_url':github_oauth_url});
});
router.get('/github/callback', function(req, res) {
    //拿code換access_token
    let code = req.query.code;
    githubOauthHandle(code, (err, body) => {
        if (err) {
            returnErrorCode(err, res);
            return;
        }
        //先找DB中是否存在
        UserDB.findOne({
            attributes: ['id', 'account', 'password', 'loginType'],
            where: {
                account: 'github' + body.id
            }
        }).then((user) => {
            if (!user) {
                return UserDB.create({
                    account: 'github' + body.id, password: 'github', loginType: 'social'
                })
            } else if (user.loginType == 'social' && user.password == 'github') {
                return Promise.resolve(user);
            }
        }).then((user) => {
            if (!user) {
                returnErrorCode('something error', res);
                return;
            }
            let jwtToken = jwt.sign({id: user.id, isLogin: true}, jwt_secret, {expiresIn: '1h'});
            res.cookie('jwtToken', jwtToken, {maxAge: 3600000}, {httpOnly: true});
            res.render('oauth_redirect', {
                status: "success",
                content: JSON.stringify({
                    user: {
                        isLogin: true,
                        id: user.id
                    }
                })
            });
        }).catch((err) => {
            console.error(err);
            returnErrorCode('something error', res);
        });
    });
});

function githubOauthHandle(code, cb){
    let token_option = {
        url:"https://github.com/login/oauth/access_token",
        method:"POST",
        form:{
            code: code,
            client_id: github_client_id,
            client_secret: github_secret_id
        }
    };
    request(token_option, function(err, response, body){
        if(err){
            returnErrorCode(response,res);
            return;
        }
        //回傳值不是JSON Format,所以要自己用Regular Expression取出
        let regex = /\=([a-zA-Z0-9]+)\&([a-zA-Z])+\=([a-zA-Z0-9]+)/;
        let result = body.match(regex);
        let token = result && result[1];
        if(!token){
            returnErrorCode("bad internet connection",res);
            return;
        }
        console.log(body);
        //拿access_token換使用者資料
        let info_option = {
            url:"https://api.github.com/user",
            method:"GET",
            headers:{
                "User-Agent": "Awesome-Octocat-App",
                "Authorization":"token "+ token
            }
        };
        request(info_option, function(err, response, body){
            cb(err, body);
        });
    });
};

module.exports = router;

let jwt_secret = 'helloworld';

// helper function
function returnCookieAndResponse(req, res, content) {
    req.user.id = content.data.user.id;
    req.user.isLogin = content.data.user.isLogin;

    let jwtToken = jwt.sign(req.user, jwt_secret, {expiresIn: '1h'});
    res.cookie('jwtToken', jwtToken, {maxAge: 3600000}, {httpOnly:true});
    res.json({
        code: 1,
        status: 'success',
        content: content
    });
    res.end();
}

function returnSuccessCode(content, res) {
    res.json({
        code: 1,
        status: 'valid',
        content: content
    });
    res.end();
}

function returnErrorCode(err, res) {
    res.json({
        code: 0,
        status: 'Invalid',
        content: {
            err: err
        }
    });
    res.end();
}
