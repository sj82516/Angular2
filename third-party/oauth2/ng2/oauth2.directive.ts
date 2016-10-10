
import {Directive, HostListener, Input, OnInit, OnDestroy, EventEmitter} from "@angular/core";
import {Observable, Subscription} from "rxjs";
import {Output} from "@angular/core/src/metadata/directives";

@Directive({
    selector:"[myOauth]"
})
export class MyOauthDirective implements OnInit, OnDestroy{
    private subOpenOauthPage:Subscription = new  Subscription();
    constructor(){}

    @Input() oauthUrl:string;
    @Output() oauthResponse:EventEmitter<any> = new EventEmitter();
    @HostListener('click') onClick(ev){
        this.subOpenOauthPage = this.oauthService(this.oauthUrl).subscribe((data)=>{
            console.log(data);
            this.oauthResponse.emit(data);
        },(err)=>{
            console.log(err);
            this.oauthResponse.emit({msg:"err"});
        });
    }

    ngOnInit(){

    }

    ngOnDestroy(){
        this.subOpenOauthPage.unsubscribe();
    }

    oauthService(oauthUrl:string) {
        let promise = new Promise((resolve, reject) => {
            let oauth_page;
            //開啟新頁面，處理oauth
            oauth_page = window.open("", "Oauth Page", "width="+window.innerWidth+"height="+window.innerHeight);
            oauth_page.document.write(this.oauthPageHTML);

            //母頁面聆聽
            window.addEventListener('message', function recieveData(e) {
                switch (e.data.msg){
                    case "ready":
                        oauth_page.postMessage(oauthUrl, location.origin);
                        break;
                    case "error":
                        window.removeEventListener('message', recieveData, false);
                        reject("error");
                        break;
                    case "close":
                        window.removeEventListener('message', recieveData, false);
                        break;
                    case "redirect":
                        window.addEventListener('message',recieveData, false);
                        break;
                    case "success":
                        window.removeEventListener('message', recieveData, false);
                        resolve(e.data);
                        break;
                }
            }, false);
        });
        return Observable.fromPromise(promise);
    }

    private oauthPageHTML:string = `
        <script type="text/javascript">
            console.log('ready');
            (function(){
                //回傳母頁面：準備完成
                window.opener.postMessage({msg:'ready'}, location.origin);
                
                window.addEventListener('message', function reciever(e) {
                    //確保訊息來源與母頁面相同
                    if(e.origin == location.origin){
                        var xhttp = new XMLHttpRequest();
                        if(!e.data){
                            console.log('oauth miss oauth url');
                        }
                        console.log(e.data);
                        xhttp.open("GET", e.data, true);
                        xhttp.withCredentials = true;
                        xhttp.send();
                        xhttp.onreadystatechange = function () {
                            //成功收到伺服器回傳的oauth2頁面後，跳轉
                            console.log(xhttp);
                            if (xhttp.status == 200) {
                                window.opener.postMessage({msg:'redirect'}, location.origin);
                                window.location = JSON.parse(xhttp.responseText).redirect_url;
                                window.removeEventListener('message', recieveData, false);
                            }else{
                                window.opener.postMessage({msg:'error'}, location.origin);
                                window.removeEventListener('message', recieveData, false);
                            }
                        };
                    }
                }, false);
            })();
            //頁面關閉時通知母頁面
            window.onunload = function(){
                window.opener.postMessage({msg:'close'}, location.origin);
                window.removeEventListener('message', recieveData, false);
            }
        </script>
    `
}