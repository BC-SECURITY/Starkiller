import{ag as m,aX as y}from"./index-e409ba63.js";var x={};(function(b){(function(_,u){if(typeof b.nodeName!="string")u(b);else{var r={};u(r),_.AnsiUp=r.default}})(m,function(_){var u=this&&this.__makeTemplateObject||function(s,e){return Object.defineProperty?Object.defineProperty(s,"raw",{value:e}):s.raw=e,s},r;(function(s){s[s.EOS=0]="EOS",s[s.Text=1]="Text",s[s.Incomplete=2]="Incomplete",s[s.ESC=3]="ESC",s[s.Unknown=4]="Unknown",s[s.SGR=5]="SGR",s[s.OSCURL=6]="OSCURL"})(r||(r={}));var d=function(){function s(){this.VERSION="5.2.1",this.setup_palettes(),this._use_classes=!1,this.bold=!1,this.italic=!1,this.underline=!1,this.fg=this.bg=null,this._buffer="",this._url_whitelist={http:1,https:1},this._escape_html=!0}return Object.defineProperty(s.prototype,"use_classes",{get:function(){return this._use_classes},set:function(e){this._use_classes=e},enumerable:!1,configurable:!0}),Object.defineProperty(s.prototype,"url_whitelist",{get:function(){return this._url_whitelist},set:function(e){this._url_whitelist=e},enumerable:!1,configurable:!0}),Object.defineProperty(s.prototype,"escape_html",{get:function(){return this._escape_html},set:function(e){this._escape_html=e},enumerable:!1,configurable:!0}),s.prototype.setup_palettes=function(){var e=this;this.ansi_colors=[[{rgb:[0,0,0],class_name:"ansi-black"},{rgb:[187,0,0],class_name:"ansi-red"},{rgb:[0,187,0],class_name:"ansi-green"},{rgb:[187,187,0],class_name:"ansi-yellow"},{rgb:[0,0,187],class_name:"ansi-blue"},{rgb:[187,0,187],class_name:"ansi-magenta"},{rgb:[0,187,187],class_name:"ansi-cyan"},{rgb:[255,255,255],class_name:"ansi-white"}],[{rgb:[85,85,85],class_name:"ansi-bright-black"},{rgb:[255,85,85],class_name:"ansi-bright-red"},{rgb:[0,255,0],class_name:"ansi-bright-green"},{rgb:[255,255,85],class_name:"ansi-bright-yellow"},{rgb:[85,85,255],class_name:"ansi-bright-blue"},{rgb:[255,85,255],class_name:"ansi-bright-magenta"},{rgb:[85,255,255],class_name:"ansi-bright-cyan"},{rgb:[255,255,255],class_name:"ansi-bright-white"}]],this.palette_256=[],this.ansi_colors.forEach(function(c){c.forEach(function(g){e.palette_256.push(g)})});for(var t=[0,95,135,175,215,255],n=0;n<6;++n)for(var i=0;i<6;++i)for(var l=0;l<6;++l){var a={rgb:[t[n],t[i],t[l]],class_name:"truecolor"};this.palette_256.push(a)}for(var f=8,h=0;h<24;++h,f+=10){var o={rgb:[f,f,f],class_name:"truecolor"};this.palette_256.push(o)}},s.prototype.escape_txt_for_html=function(e){return this._escape_html?e.replace(/[&<>"']/gm,function(t){if(t==="&")return"&amp;";if(t==="<")return"&lt;";if(t===">")return"&gt;";if(t==='"')return"&quot;";if(t==="'")return"&#x27;"}):e},s.prototype.append_buffer=function(e){var t=this._buffer+e;this._buffer=t},s.prototype.get_next_packet=function(){var e={kind:r.EOS,text:"",url:""},t=this._buffer.length;if(t==0)return e;var n=this._buffer.indexOf("\x1B");if(n==-1)return e.kind=r.Text,e.text=this._buffer,this._buffer="",e;if(n>0)return e.kind=r.Text,e.text=this._buffer.slice(0,n),this._buffer=this._buffer.slice(n),e;if(n==0){if(t<3)return e.kind=r.Incomplete,e;var i=this._buffer.charAt(1);if(i!="["&&i!="]"&&i!="(")return e.kind=r.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;if(i=="["){this._csi_regex||(this._csi_regex=p(u([`
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
                    `])));var l=this._buffer.match(this._csi_regex);if(l===null)return e.kind=r.Incomplete,e;if(l[4])return e.kind=r.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;l[1]!=""||l[3]!="m"?e.kind=r.Unknown:e.kind=r.SGR,e.text=l[2];var a=l[0].length;return this._buffer=this._buffer.slice(a),e}else if(i=="]"){if(t<4)return e.kind=r.Incomplete,e;if(this._buffer.charAt(2)!="8"||this._buffer.charAt(3)!=";")return e.kind=r.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;this._osc_st||(this._osc_st=v(u([`
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
                    `]))),this._osc_st.lastIndex=0;{var f=this._osc_st.exec(this._buffer);if(f===null)return e.kind=r.Incomplete,e;if(f[3])return e.kind=r.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e}{var h=this._osc_st.exec(this._buffer);if(h===null)return e.kind=r.Incomplete,e;if(h[3])return e.kind=r.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e}this._osc_regex||(this._osc_regex=p(u([`
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
                    `])));var l=this._buffer.match(this._osc_regex);if(l===null)return e.kind=r.ESC,e.text=this._buffer.slice(0,1),this._buffer=this._buffer.slice(1),e;e.kind=r.OSCURL,e.url=l[1],e.text=l[2];var a=l[0].length;return this._buffer=this._buffer.slice(a),e}else if(i=="(")return e.kind=r.Unknown,this._buffer=this._buffer.slice(3),e}},s.prototype.ansi_to_html=function(e){this.append_buffer(e);for(var t=[];;){var n=this.get_next_packet();if(n.kind==r.EOS||n.kind==r.Incomplete)break;n.kind==r.ESC||n.kind==r.Unknown||(n.kind==r.Text?t.push(this.transform_to_html(this.with_state(n))):n.kind==r.SGR?this.process_ansi(n):n.kind==r.OSCURL&&t.push(this.process_hyperlink(n)))}return t.join("")},s.prototype.with_state=function(e){return{bold:this.bold,italic:this.italic,underline:this.underline,fg:this.fg,bg:this.bg,text:e.text}},s.prototype.process_ansi=function(e){for(var t=e.text.split(";");t.length>0;){var n=t.shift(),i=parseInt(n,10);if(isNaN(i)||i===0)this.fg=this.bg=null,this.bold=!1,this.italic=!1,this.underline=!1;else if(i===1)this.bold=!0;else if(i===3)this.italic=!0;else if(i===4)this.underline=!0;else if(i===22)this.bold=!1;else if(i===23)this.italic=!1;else if(i===24)this.underline=!1;else if(i===39)this.fg=null;else if(i===49)this.bg=null;else if(i>=30&&i<38)this.fg=this.ansi_colors[0][i-30];else if(i>=40&&i<48)this.bg=this.ansi_colors[0][i-40];else if(i>=90&&i<98)this.fg=this.ansi_colors[1][i-90];else if(i>=100&&i<108)this.bg=this.ansi_colors[1][i-100];else if((i===38||i===48)&&t.length>0){var l=i===38,a=t.shift();if(a==="5"&&t.length>0){var f=parseInt(t.shift(),10);f>=0&&f<=255&&(l?this.fg=this.palette_256[f]:this.bg=this.palette_256[f])}if(a==="2"&&t.length>2){var h=parseInt(t.shift(),10),o=parseInt(t.shift(),10),c=parseInt(t.shift(),10);if(h>=0&&h<=255&&o>=0&&o<=255&&c>=0&&c<=255){var g={rgb:[h,o,c],class_name:"truecolor"};l?this.fg=g:this.bg=g}}}}},s.prototype.transform_to_html=function(e){var t=e.text;if(t.length===0||(t=this.escape_txt_for_html(t),!e.bold&&!e.italic&&!e.underline&&e.fg===null&&e.bg===null))return t;var n=[],i=[],l=e.fg,a=e.bg;e.bold&&n.push("font-weight:bold"),e.italic&&n.push("font-style:italic"),e.underline&&n.push("text-decoration:underline"),this._use_classes?(l&&(l.class_name!=="truecolor"?i.push(l.class_name+"-fg"):n.push("color:rgb("+l.rgb.join(",")+")")),a&&(a.class_name!=="truecolor"?i.push(a.class_name+"-bg"):n.push("background-color:rgb("+a.rgb.join(",")+")"))):(l&&n.push("color:rgb("+l.rgb.join(",")+")"),a&&n.push("background-color:rgb("+a.rgb+")"));var f="",h="";return i.length&&(f=' class="'+i.join(" ")+'"'),n.length&&(h=' style="'+n.join(";")+'"'),"<span"+h+f+">"+t+"</span>"},s.prototype.process_hyperlink=function(e){var t=e.url.split(":");if(t.length<1||!this._url_whitelist[t[0]])return"";var n='<a href="'+this.escape_txt_for_html(e.url)+'">'+this.escape_txt_for_html(e.text)+"</a>";return n},s}();function p(s){var e=s.raw[0],t=/^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm,n=e.replace(t,"");return new RegExp(n)}function v(s){var e=s.raw[0],t=/^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm,n=e.replace(t,"");return new RegExp(n,"g")}Object.defineProperty(_,"__esModule",{value:!0}),_.default=d})})(x);const E=y(x);export{E as A};
