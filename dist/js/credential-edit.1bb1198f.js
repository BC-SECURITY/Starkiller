(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["credential-edit"],{"0798":function(t,e,i){"use strict";var n=i("5530"),o=i("ade3"),r=(i("caad"),i("0c18"),i("10d2")),s=i("afdd"),a=i("9d26"),c=i("f2e7"),l=i("7560"),d=i("f40d"),u=i("58df"),h=i("d9bd");e["a"]=Object(u["a"])(r["a"],c["a"],d["a"]).extend({name:"v-alert",props:{border:{type:String,validator:function(t){return["top","right","bottom","left"].includes(t)}},closeLabel:{type:String,default:"$vuetify.close"},coloredBorder:Boolean,dense:Boolean,dismissible:Boolean,closeIcon:{type:String,default:"$cancel"},icon:{default:"",type:[Boolean,String],validator:function(t){return"string"===typeof t||!1===t}},outlined:Boolean,prominent:Boolean,text:Boolean,type:{type:String,validator:function(t){return["info","error","success","warning"].includes(t)}},value:{type:Boolean,default:!0}},computed:{__cachedBorder:function(){if(!this.border)return null;var t={staticClass:"v-alert__border",class:Object(o["a"])({},"v-alert__border--".concat(this.border),!0)};return this.coloredBorder&&(t=this.setBackgroundColor(this.computedColor,t),t.class["v-alert__border--has-color"]=!0),this.$createElement("div",t)},__cachedDismissible:function(){var t=this;if(!this.dismissible)return null;var e=this.iconColor;return this.$createElement(s["a"],{staticClass:"v-alert__dismissible",props:{color:e,icon:!0,small:!0},attrs:{"aria-label":this.$vuetify.lang.t(this.closeLabel)},on:{click:function(){return t.isActive=!1}}},[this.$createElement(a["a"],{props:{color:e}},this.closeIcon)])},__cachedIcon:function(){return this.computedIcon?this.$createElement(a["a"],{staticClass:"v-alert__icon",props:{color:this.iconColor}},this.computedIcon):null},classes:function(){var t=Object(n["a"])(Object(n["a"])({},r["a"].options.computed.classes.call(this)),{},{"v-alert--border":Boolean(this.border),"v-alert--dense":this.dense,"v-alert--outlined":this.outlined,"v-alert--prominent":this.prominent,"v-alert--text":this.text});return this.border&&(t["v-alert--border-".concat(this.border)]=!0),t},computedColor:function(){return this.color||this.type},computedIcon:function(){return!1!==this.icon&&("string"===typeof this.icon&&this.icon?this.icon:!!["error","info","success","warning"].includes(this.type)&&"$".concat(this.type))},hasColoredIcon:function(){return this.hasText||Boolean(this.border)&&this.coloredBorder},hasText:function(){return this.text||this.outlined},iconColor:function(){return this.hasColoredIcon?this.computedColor:void 0},isDark:function(){return!(!this.type||this.coloredBorder||this.outlined)||l["a"].options.computed.isDark.call(this)}},created:function(){this.$attrs.hasOwnProperty("outline")&&Object(h["a"])("outline","outlined",this)},methods:{genWrapper:function(){var t=[this.$slots.prepend||this.__cachedIcon,this.genContent(),this.__cachedBorder,this.$slots.append,this.$scopedSlots.close?this.$scopedSlots.close({toggle:this.toggle}):this.__cachedDismissible],e={staticClass:"v-alert__wrapper"};return this.$createElement("div",e,t)},genContent:function(){return this.$createElement("div",{staticClass:"v-alert__content"},this.$slots.default)},genAlert:function(){var t={staticClass:"v-alert",attrs:{role:"alert"},on:this.listeners$,class:this.classes,style:this.styles,directives:[{name:"show",value:this.isActive}]};if(!this.coloredBorder){var e=this.hasText?this.setTextColor:this.setBackgroundColor;t=e(this.computedColor,t)}return this.$createElement("div",t,[this.genWrapper()])},toggle:function(){this.isActive=!this.isActive}},render:function(t){var e=this.genAlert();return this.transition?t("transition",{props:{name:this.transition,origin:this.origin,mode:this.mode}},[e]):e}})},"0c18":function(t,e,i){},"1dc0":function(t,e,i){"use strict";var n=function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("portal",{attrs:{to:"app-bar"}},[i("div",{staticClass:"v-toolbar__content",staticStyle:{width:"100%"}},[i("v-breadcrumbs",{attrs:{items:t.breads}}),i("v-spacer"),t._t("extra-stuff"),t.showDelete&&!t.smallDelete?i("v-btn",{staticClass:"mr-2",attrs:{color:"error",text:""},on:{click:function(e){return t.$emit("delete")}}},[t._v(" "+t._s(t.deleteText)+" "),i("v-icon",{attrs:{right:""}},[t._v(" fa-trash-alt ")])],1):t.showDelete&&t.smallDelete?i("tooltip-button",{attrs:{icon:"fa-trash-alt",color:"error",text:t.deleteText},on:{click:function(e){return t.$emit("delete")}}}):t._e(),t.showCopy&&Object.keys(t.copyLink).length>0&&!t.smallCopy?i("v-btn",{staticClass:"mr-2",attrs:{color:"primary",text:"",to:t.copyLink}},[t._v(" "+t._s(t.copyText)+" "),i("v-icon",{attrs:{right:""}},[t._v(" fa-copy ")])],1):t.showCopy&&Object.keys(t.copyLink).length>0&&t.smallCopy?i("tooltip-button",{attrs:{icon:"fa-copy",text:t.copyText,to:t.copyLink}}):t._e(),t.showSubmit?i("v-btn",{staticClass:"primary",attrs:{disabled:t.disableSubmit,type:"submit",loading:t.submitLoading},on:{click:function(e){return t.$emit("submit")}}},[t._v(" "+t._s(t.submitText)+" ")]):t._e()],2)])},o=[],r=i("9442"),s={name:"ListPageTop",components:{TooltipButton:r["a"]},props:{deleteText:{type:String,default:"Delete"},copyText:{type:String,default:"Copy"},submitText:{type:String,default:"Submit"},showDelete:{type:Boolean,default:!1},showCopy:{type:Boolean,default:!1},showSubmit:{type:Boolean,default:!1},disableSubmit:{type:Boolean},submitLoading:{type:Boolean,default:!1},copyLink:{type:Object,default:function(){}},smallCopy:{type:Boolean,default:!1},smallDelete:{type:Boolean,default:!1},breads:{type:Array,default:function(){return[]}}}},a=s,c=i("2877"),l=i("6544"),d=i.n(l),u=i("2bc5"),h=i("8336"),p=i("132d"),f=i("2fa4"),m=Object(c["a"])(a,n,o,!1,null,null,null);e["a"]=m.exports;d()(m,{VBreadcrumbs:u["a"],VBtn:h["a"],VIcon:p["a"],VSpacer:f["a"]})},"3a2f":function(t,e,i){"use strict";var n=i("ade3"),o=(i("a9e3"),i("9734"),i("4ad4")),r=i("a9ad"),s=i("16b7"),a=i("b848"),c=i("f573"),l=i("80d2"),d=i("d9bd"),u=i("58df");e["a"]=Object(u["a"])(r["a"],s["a"],a["a"],c["a"]).extend({name:"v-tooltip",props:{closeDelay:{type:[Number,String],default:0},disabled:Boolean,openDelay:{type:[Number,String],default:0},openOnHover:{type:Boolean,default:!0},openOnFocus:{type:Boolean,default:!0},tag:{type:String,default:"span"},transition:String},data:function(){return{calculatedMinWidth:0,closeDependents:!1}},computed:{calculatedLeft:function(){var t=this.dimensions,e=t.activator,i=t.content,n=!this.bottom&&!this.left&&!this.top&&!this.right,o=!1!==this.attach?e.offsetLeft:e.left,r=0;return this.top||this.bottom||n?r=o+e.width/2-i.width/2:(this.left||this.right)&&(r=o+(this.right?e.width:-i.width)+(this.right?10:-10)),this.nudgeLeft&&(r-=parseInt(this.nudgeLeft)),this.nudgeRight&&(r+=parseInt(this.nudgeRight)),"".concat(this.calcXOverflow(r,this.dimensions.content.width),"px")},calculatedTop:function(){var t=this.dimensions,e=t.activator,i=t.content,n=!1!==this.attach?e.offsetTop:e.top,o=0;return this.top||this.bottom?o=n+(this.bottom?e.height:-i.height)+(this.bottom?10:-10):(this.left||this.right)&&(o=n+e.height/2-i.height/2),this.nudgeTop&&(o-=parseInt(this.nudgeTop)),this.nudgeBottom&&(o+=parseInt(this.nudgeBottom)),!1===this.attach&&(o+=this.pageYOffset),"".concat(this.calcYOverflow(o),"px")},classes:function(){return{"v-tooltip--top":this.top,"v-tooltip--right":this.right,"v-tooltip--bottom":this.bottom,"v-tooltip--left":this.left,"v-tooltip--attached":""===this.attach||!0===this.attach||"attach"===this.attach}},computedTransition:function(){return this.transition?this.transition:this.isActive?"scale-transition":"fade-transition"},offsetY:function(){return this.top||this.bottom},offsetX:function(){return this.left||this.right},styles:function(){return{left:this.calculatedLeft,maxWidth:Object(l["i"])(this.maxWidth),minWidth:Object(l["i"])(this.minWidth),top:this.calculatedTop,zIndex:this.zIndex||this.activeZIndex}}},beforeMount:function(){var t=this;this.$nextTick((function(){t.value&&t.callActivate()}))},mounted:function(){"v-slot"===Object(l["v"])(this,"activator",!0)&&Object(d["b"])("v-tooltip's activator slot must be bound, try '<template #activator=\"data\"><v-btn v-on=\"data.on>'",this)},methods:{activate:function(){this.updateDimensions(),requestAnimationFrame(this.startTransition)},deactivate:function(){this.runDelay("close")},genActivatorListeners:function(){var t=this,e=o["a"].options.methods.genActivatorListeners.call(this);return this.openOnFocus&&(e.focus=function(e){t.getActivator(e),t.runDelay("open")},e.blur=function(e){t.getActivator(e),t.runDelay("close")}),e.keydown=function(e){e.keyCode===l["A"].esc&&(t.getActivator(e),t.runDelay("close"))},e},genActivatorAttributes:function(){return{"aria-haspopup":!0,"aria-expanded":String(this.isActive)}},genTransition:function(){var t=this.genContent();return this.computedTransition?this.$createElement("transition",{props:{name:this.computedTransition}},[t]):t},genContent:function(){var t;return this.$createElement("div",this.setBackgroundColor(this.color,{staticClass:"v-tooltip__content",class:(t={},Object(n["a"])(t,this.contentClass,!0),Object(n["a"])(t,"menuable__content__active",this.isActive),Object(n["a"])(t,"v-tooltip__content--fixed",this.activatorFixed),t),style:this.styles,attrs:this.getScopeIdAttrs(),directives:[{name:"show",value:this.isContentActive}],ref:"content"}),this.getContentSlot())}},render:function(t){var e=this;return t(this.tag,{staticClass:"v-tooltip",class:this.classes},[this.showLazyContent((function(){return[e.genTransition()]})),this.genActivator()])}})},"6bbe":function(t,e,i){"use strict";var n=function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("v-alert",{attrs:{prominent:"",type:"error"}},[i("v-row",{attrs:{align:"center"}},[i("v-col",{staticClass:"grow"},[t._v(" "+t._s(t.message)+" ")]),i("v-col",{staticClass:"shrink"},[i("v-btn",{on:{click:function(e){return t.$router.go(-1)}}},[t._v(" Go back ")])],1)],1)],1)},o=[],r=(i("a9e3"),i("99af"),void 0),s={name:"ErrorStateAlert",props:{resourceType:{type:String,required:!0},resourceId:{type:[String,Number],required:!0},message:{type:String,default:function(){return"The resource '".concat(r.resourceType,"/").concat(r.resourceId,"' Not Found.")}}}},a=s,c=i("2877"),l=i("6544"),d=i.n(l),u=i("0798"),h=i("8336"),p=i("62ad"),f=i("0fd9"),m=Object(c["a"])(a,n,o,!1,null,null,null);e["a"]=m.exports;d()(m,{VAlert:u["a"],VBtn:h["a"],VCol:p["a"],VRow:f["a"]})},9734:function(t,e,i){},"9d28":function(t,e,i){"use strict";i.r(e);var n=function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",[i("edit-page-top",{attrs:{breads:t.breads,"show-submit":!0,"show-copy":!!t.id,"show-delete":!!t.id,"submit-loading":t.loading,"copy-link":t.copyLink,"small-copy":!0,"small-delete":!0},on:{submit:t.submit,delete:t.deleteCredential}}),i("h3",[t._v(t._s(t.mode)+" Credential")]),t.errorState?i("error-state-alert",{attrs:{"resource-id":t.id,"resource-type":"credential"}}):i("v-card",{staticStyle:{padding:"10px"}},[t.reset?i("general-form",{ref:"generalform",attrs:{options:t.options,readonly:!t.canEdit},model:{value:t.form,callback:function(e){t.form=e},expression:"form"}}):t._e()],1)],1)},o=[],r=i("1da1"),s=(i("96cf"),i("b0c0"),i("159b"),i("b64b"),i("5d09")),a=i("83b4"),c=i("6bbe"),l=i("1dc0"),d={name:"CredentialEdit",components:{GeneralForm:a["a"],ErrorStateAlert:c["a"],EditPageTop:l["a"]},data:function(){return{reset:!0,loading:!1,initialLoad:!0,credential:{},form:{},errorState:!1}},computed:{breads:function(){return[{text:"Credentials",disabled:!1,to:"/credentials",exact:!0},{text:this.id&&!this.isCopy?"".concat(this.id):"New",disabled:!0,to:"/credential-edit"}]},isNew:function(){return"credentialNew"===this.$route.name},isCopy:function(){return!0===this.$route.params.copy},mode:function(){return this.isCopy?"Copy":this.isNew?"New":"Edit"},canEdit:function(){return!0},id:function(){return this.$route.params.id},copyLink:function(){return this.id>0?{name:"credentialNew",params:{copy:!0,id:this.id}}:{}},options:function(){var t=this,e={credtype:{required:!0,strict:!0,suggested_values:["plaintext","hash"]},domain:{required:!0},username:{required:!0},password:{required:!0},host:{required:!0},os:{required:!1},sid:{required:!1},notes:{required:!1}};return Object.keys(this.credential).forEach((function(i){"id"!==i&&e[i]&&(e[i].value=t.credential[i])})),e}},mounted:function(){this.isNew&&!this.isCopy||this.getCredential(this.id)},methods:{submit:function(){var t=this;!this.loading&&this.$refs.generalform.$refs.form.validate()&&(this.loading=!0,this.isNew?s["a"](this.form).then((function(e){var i=e.id;t.loading=!1,t.$router.push({name:"credentialEdit",params:{id:i}})})).catch((function(e){t.$snack.error("Error: ".concat(e)),t.loading=!1})):s["e"](this.id,this.form).then((function(){t.loading=!1})).catch((function(e){t.$snack.error("Error: ".concat(e)),t.loading=!1})),this.loading=!1)},deleteCredential:function(){var t=this;return Object(r["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,t.$root.$confirm("Delete","Are you sure you want to delete credential ".concat(t.id,"?"),{color:"red"});case 2:if(!e.sent){e.next=4;break}try{t.$store.dispatch("credential/deleteCredential",t.id),t.$router.push({name:"credentials"})}catch(i){t.$snack.error("Error: ".concat(i))}case 4:case"end":return e.stop()}}),e)})))()},getCredential:function(t){var e=this;s["c"](t).then((function(t){e.reset=!1,e.credential=t,e.initialLoad=!1,setTimeout((function(){e.reset=!0}),500)})).catch((function(){e.errorState=!0}))}}},u=d,h=i("2877"),p=i("6544"),f=i.n(p),m=i("b0af"),v=Object(h["a"])(u,n,o,!1,null,null,null);e["default"]=v.exports;f()(v,{VCard:m["a"]})},afdd:function(t,e,i){"use strict";var n=i("8336");e["a"]=n["a"]},f40d:function(t,e,i){"use strict";var n=i("2b0e");e["a"]=n["default"].extend({name:"transitionable",props:{mode:String,origin:String,transition:String}})}}]);
//# sourceMappingURL=credential-edit.1bb1198f.js.map