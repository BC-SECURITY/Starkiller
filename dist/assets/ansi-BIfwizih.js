import{no as e,oo as t}from"./index-CUSKKFIU.js";var n=t(e((e=>{(function(t,n){if(typeof define==`function`&&define.amd)define([`exports`],n);else if(typeof e==`object`&&typeof e.nodeName!=`string`)n(e);else{var r={};n(r),t.AnsiUp=r.default}})(e,function(e){var t=this&&this.__makeTemplateObject||function(e,t){return Object.defineProperty?Object.defineProperty(e,"raw",{value:t}):e.raw=t,e},n;(function(e){e[e.EOS=0]=`EOS`,e[e.Text=1]=`Text`,e[e.Incomplete=2]=`Incomplete`,e[e.ESC=3]=`ESC`,e[e.Unknown=4]=`Unknown`,e[e.SGR=5]=`SGR`,e[e.OSCURL=6]=`OSCURL`})(n||={});var r=function(){function e(){this.VERSION=`5.2.1`,this.setup_palettes(),this._use_classes=!1,this.bold=!1,this.italic=!1,this.underline=!1,this.fg=this.bg=null,this._buffer=``,this._url_whitelist={http:1,https:1},this._escape_html=!0}return Object.defineProperty(e.prototype,"use_classes",{get:function(){return this._use_classes},set:function(e){this._use_classes=e},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"url_whitelist",{get:function(){return this._url_whitelist},set:function(e){this._url_whitelist=e},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"escape_html",{get:function(){return this._escape_html},set:function(e){this._escape_html=e},enumerable:!1,configurable:!0}),e.prototype.setup_palettes=function(){var e=this;this.ansi_colors=[[{rgb:[0,0,0],class_name:`ansi-black`},{rgb:[187,0,0],class_name:`ansi-red`},{rgb:[0,187,0],class_name:`ansi-green`},{rgb:[187,187,0],class_name:`ansi-yellow`},{rgb:[0,0,187],class_name:`ansi-blue`},{rgb:[187,0,187],class_name:`ansi-magenta`},{rgb:[0,187,187],class_name:`ansi-cyan`},{rgb:[255,255,255],class_name:`ansi-white`}],[{rgb:[85,85,85],class_name:`ansi-bright-black`},{rgb:[255,85,85],class_name:`ansi-bright-red`},{rgb:[0,255,0],class_name:`ansi-bright-green`},{rgb:[255,255,85],class_name:`ansi-bright-yellow`},{rgb:[85,85,255],class_name:`ansi-bright-blue`},{rgb:[255,85,255],class_name:`ansi-bright-magenta`},{rgb:[85,255,255],class_name:`ansi-bright-cyan`},{rgb:[255,255,255],class_name:`ansi-bright-white`}]],this.palette_256=[],this.ansi_colors.forEach(function(t){t.forEach(function(t){e.palette_256.push(t)})});for(var t=[0,95,135,175,215,255],n=0;n<6;++n)for(var r=0;r<6;++r)for(var i=0;i<6;++i){var a={rgb:[t[n],t[r],t[i]],class_name:`truecolor`};this.palette_256.push(a)}for(var o=8,s=0;s<24;++s,o+=10){var c={rgb:[o,o,o],class_name:`truecolor`};this.palette_256.push(c)}},e.prototype.escape_txt_for_html=function(e){return this._escape_html?e.replace(/[&<>"']/gm,function(e){if(e===`&`)return`&amp;`;if(e===`<`)return`&lt;`;if(e===`>`)return`&gt;`;if(e===`"`)return`&quot;`;if(e===`'`)return`&#x27;`}):e},e.prototype.append_buffer=function(e){var t=this._buffer+e;this._buffer=t},e.prototype.get_next_packet=function(){var e={kind:n.EOS,text:``,url:``},r=this._buffer.length;if(r==0)return e;var o=this._buffer.indexOf(`\x1B`);if(o==-1)return e.kind=n.Text,e.text=this._buffer,this._buffer=``,e;if(o>0)return e.kind=n.Text,e.text=this._buffer.slice(0,o),this._buffer=this._buffer.slice(o),e;if(o==0){if(r<3)return e.kind=n.Incomplete,e;var s=this._buffer.charAt(1);if(s!=`[`&&s!=`]`&&s!=`(`)return e.kind=n.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;if(s==`[`){this._csi_regex||=i(t([`
                        ^                           # beginning of line
                                                    #
                                                    # First attempt
                        (?:                         # legal sequence
                          \x1B[                      # CSI
                          ([<-?]?)              # private-mode char
                          ([d;]*)                    # any digits or semicolons
                          ([ -/]?               # an intermediate modifier
                          [@-~])                # the command
                        )
                        |                           # alternate (second attempt)
                        (?:                         # illegal sequence
                          \x1B[                      # CSI
                          [ -~]*                # anything legal
                          ([\0-:])              # anything illegal
                        )
                    `],[`
                        ^                           # beginning of line
                                                    #
                                                    # First attempt
                        (?:                         # legal sequence
                          \\x1b\\[                      # CSI
                          ([\\x3c-\\x3f]?)              # private-mode char
                          ([\\d;]*)                    # any digits or semicolons
                          ([\\x20-\\x2f]?               # an intermediate modifier
                          [\\x40-\\x7e])                # the command
                        )
                        |                           # alternate (second attempt)
                        (?:                         # illegal sequence
                          \\x1b\\[                      # CSI
                          [\\x20-\\x7e]*                # anything legal
                          ([\\x00-\\x1f:])              # anything illegal
                        )
                    `]));var c=this._buffer.match(this._csi_regex);if(c===null)return e.kind=n.Incomplete,e;if(c[4])return e.kind=n.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;c[1]!=``||c[3]!=`m`?e.kind=n.Unknown:e.kind=n.SGR,e.text=c[2];var l=c[0].length;return this._buffer=this._buffer.slice(l),e}else if(s==`]`){if(r<4)return e.kind=n.Incomplete,e;if(this._buffer.charAt(2)!=`8`||this._buffer.charAt(3)!=`;`)return e.kind=n.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;this._osc_st||=a(t([`
                        (?:                         # legal sequence
                          (\x1B\\)                    # ESC                           |                           # alternate
                          (\x07)                      # BEL (what xterm did)
                        )
                        |                           # alternate (second attempt)
                        (                           # illegal sequence
                          [\0-]                 # anything illegal
                          |                           # alternate
                          [\b-]                 # anything illegal
                          |                           # alternate
                          [-]                 # anything illegal
                        )
                    `],[`
                        (?:                         # legal sequence
                          (\\x1b\\\\)                    # ESC \\
                          |                           # alternate
                          (\\x07)                      # BEL (what xterm did)
                        )
                        |                           # alternate (second attempt)
                        (                           # illegal sequence
                          [\\x00-\\x06]                 # anything illegal
                          |                           # alternate
                          [\\x08-\\x1a]                 # anything illegal
                          |                           # alternate
                          [\\x1c-\\x1f]                 # anything illegal
                        )
                    `])),this._osc_st.lastIndex=0;var u=this._osc_st.exec(this._buffer);if(u===null)return e.kind=n.Incomplete,e;if(u[3])return e.kind=n.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;var d=this._osc_st.exec(this._buffer);if(d===null)return e.kind=n.Incomplete,e;if(d[3])return e.kind=n.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;this._osc_regex||=i(t([`
                        ^                           # beginning of line
                                                    #
                        \x1B]8;                    # OSC Hyperlink
                        [ -:<-~]*       # params (excluding ;)
                        ;                           # end of params
                        ([!-~]{0,512})        # URL capture
                        (?:                         # ST
                          (?:\x1B\\)                  # ESC                           |                           # alternate
                          (?:\x07)                    # BEL (what xterm did)
                        )
                        ([ -~]+)              # TEXT capture
                        \x1B]8;;                   # OSC Hyperlink End
                        (?:                         # ST
                          (?:\x1B\\)                  # ESC                           |                           # alternate
                          (?:\x07)                    # BEL (what xterm did)
                        )
                    `],[`
                        ^                           # beginning of line
                                                    #
                        \\x1b\\]8;                    # OSC Hyperlink
                        [\\x20-\\x3a\\x3c-\\x7e]*       # params (excluding ;)
                        ;                           # end of params
                        ([\\x21-\\x7e]{0,512})        # URL capture
                        (?:                         # ST
                          (?:\\x1b\\\\)                  # ESC \\
                          |                           # alternate
                          (?:\\x07)                    # BEL (what xterm did)
                        )
                        ([\\x20-\\x7e]+)              # TEXT capture
                        \\x1b\\]8;;                   # OSC Hyperlink End
                        (?:                         # ST
                          (?:\\x1b\\\\)                  # ESC \\
                          |                           # alternate
                          (?:\\x07)                    # BEL (what xterm did)
                        )
                    `]));var c=this._buffer.match(this._osc_regex);if(c===null)return e.kind=n.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;e.kind=n.OSCURL,e.url=c[1],e.text=c[2];var l=c[0].length;return this._buffer=this._buffer.slice(l),e}else if(s==`(`)return e.kind=n.Unknown,this._buffer=this._buffer.slice(3),e}},e.prototype.ansi_to_html=function(e){this.append_buffer(e);for(var t=[];;){var r=this.get_next_packet();if(r.kind==n.EOS||r.kind==n.Incomplete)break;r.kind==n.ESC||r.kind==n.Unknown||(r.kind==n.Text?t.push(this.transform_to_html(this.with_state(r))):r.kind==n.SGR?this.process_ansi(r):r.kind==n.OSCURL&&t.push(this.process_hyperlink(r)))}return t.join(``)},e.prototype.with_state=function(e){return{bold:this.bold,italic:this.italic,underline:this.underline,fg:this.fg,bg:this.bg,text:e.text}},e.prototype.process_ansi=function(e){for(var t=e.text.split(`;`);t.length>0;){var n=t.shift(),r=parseInt(n,10);if(isNaN(r)||r===0)this.fg=this.bg=null,this.bold=!1,this.italic=!1,this.underline=!1;else if(r===1)this.bold=!0;else if(r===3)this.italic=!0;else if(r===4)this.underline=!0;else if(r===22)this.bold=!1;else if(r===23)this.italic=!1;else if(r===24)this.underline=!1;else if(r===39)this.fg=null;else if(r===49)this.bg=null;else if(r>=30&&r<38)this.fg=this.ansi_colors[0][r-30];else if(r>=40&&r<48)this.bg=this.ansi_colors[0][r-40];else if(r>=90&&r<98)this.fg=this.ansi_colors[1][r-90];else if(r>=100&&r<108)this.bg=this.ansi_colors[1][r-100];else if((r===38||r===48)&&t.length>0){var i=r===38,a=t.shift();if(a===`5`&&t.length>0){var o=parseInt(t.shift(),10);o>=0&&o<=255&&(i?this.fg=this.palette_256[o]:this.bg=this.palette_256[o])}if(a===`2`&&t.length>2){var s=parseInt(t.shift(),10),c=parseInt(t.shift(),10),l=parseInt(t.shift(),10);if(s>=0&&s<=255&&c>=0&&c<=255&&l>=0&&l<=255){var u={rgb:[s,c,l],class_name:`truecolor`};i?this.fg=u:this.bg=u}}}}},e.prototype.transform_to_html=function(e){var t=e.text;if(t.length===0||(t=this.escape_txt_for_html(t),!e.bold&&!e.italic&&!e.underline&&e.fg===null&&e.bg===null))return t;var n=[],r=[],i=e.fg,a=e.bg;e.bold&&n.push(`font-weight:bold`),e.italic&&n.push(`font-style:italic`),e.underline&&n.push(`text-decoration:underline`),this._use_classes?(i&&(i.class_name===`truecolor`?n.push(`color:rgb(`+i.rgb.join(`,`)+`)`):r.push(i.class_name+`-fg`)),a&&(a.class_name===`truecolor`?n.push(`background-color:rgb(`+a.rgb.join(`,`)+`)`):r.push(a.class_name+`-bg`))):(i&&n.push(`color:rgb(`+i.rgb.join(`,`)+`)`),a&&n.push(`background-color:rgb(`+a.rgb+`)`));var o=``,s=``;return r.length&&(o=` class="`+r.join(` `)+`"`),n.length&&(s=` style="`+n.join(`;`)+`"`),`<span`+s+o+`>`+t+`</span>`},e.prototype.process_hyperlink=function(e){var t=e.url.split(`:`);return t.length<1||!this._url_whitelist[t[0]]?``:`<a href="`+this.escape_txt_for_html(e.url)+`">`+this.escape_txt_for_html(e.text)+`</a>`},e}();function i(e){var t=e.raw[0].replace(/^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm,``);return new RegExp(t)}function a(e){var t=e.raw[0].replace(/^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm,``);return new RegExp(t,`g`)}Object.defineProperty(e,"__esModule",{value:!0}),e.default=r})}))());function r(e){return e.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g,``)}function i(e){return r(e)!==e}function a(e){return new n.default().ansi_to_html(e)}export{r as i,n,i as r,a as t};