(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["reporting"],{"1b32":function(e,t,n){},"828a":function(e,t,n){"use strict";var a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("portal",{attrs:{to:"app-bar"}},[n("div",{staticClass:"v-toolbar__content",staticStyle:{width:"100%"}},[n("v-breadcrumbs",{attrs:{items:e.breads}}),n("v-spacer"),e._t("extra-stuff"),n("div",[e.showDelete?n("v-btn",{staticClass:"mr-2",attrs:{color:"error",text:""},on:{click:function(t){return e.$emit("delete")}}},[e._v(" "+e._s(e.deleteText)+" "),n("v-icon",{attrs:{right:""}},[e._v(" fa-trash-alt ")])],1):e._e(),e.showRefresh?n("v-btn",{staticClass:"mr-2",attrs:{disabled:e.refreshLoading,color:"primary",text:""},on:{click:function(t){return e.$emit("refresh")}}},[e._v(" "+e._s(e.refreshText)+" "),n("v-icon",{attrs:{right:""}},[e._v(" fa-redo "+e._s(e.refreshLoading?"fa-spin":"")+" ")])],1):e._e(),e.showCreate?n("v-btn",{staticClass:"mr-2",attrs:{color:"primary",rounded:""},on:{click:function(t){return e.$emit("create")}}},[e._v(" "+e._s(e.createText)+" "),n("v-icon",{attrs:{right:""}},[e._v(" fa-plus-square ")])],1):e._e()],1)],2)])},s=[],r={name:"ListPageTop",props:{deleteText:{type:String,default:"Delete"},refreshText:{type:String,default:"Refresh"},createText:{type:String,default:"Create"},showDelete:{type:Boolean,default:!1},showRefresh:{type:Boolean,default:!1},showCreate:{type:Boolean,default:!1},refreshLoading:{type:Boolean,default:!1},breads:{type:Array,default:function(){return[]}}}},i=r,o=n("2877"),l=n("6544"),c=n.n(l),u=n("2bc5"),d=n("8336"),p=n("132d"),f=n("2fa4"),g=Object(o["a"])(i,a,s,!1,null,null,null);t["a"]=g.exports;c()(g,{VBreadcrumbs:u["a"],VBtn:d["a"],VIcon:p["a"],VSpacer:f["a"]})},"8f48":function(e,t,n){"use strict";var a=n("1b32"),s=n.n(a);s.a},9442:function(e,t,n){"use strict";var a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("v-tooltip",{attrs:{bottom:""},scopedSlots:e._u([{key:"activator",fn:function(t){var a=t.on;return[n("v-btn",e._g({staticClass:"mr-5",attrs:{color:e.flat?"":e.color,to:e.to,icon:"",small:!e.xSmall,"x-small":e.xSmall},on:{click:function(t){return e.$emit("click")}}},a),[n("v-icon",{style:0!==e.padLeft?"padding-left: "+e.padLeft+"px":""},[e._v(" "+e._s(e.icon)+" ")])],1)]}}])},[n("span",[e._v(e._s(e.text))])])},s=[],r=(n("a9e3"),{name:"TooltipButton",props:{icon:{type:String,required:!0},text:{type:String,required:!0},padLeft:{type:Number,default:0},color:{type:String,default:""},flat:{type:Boolean,default:!1},to:{type:Object,default:null},xSmall:{type:Boolean,default:!1}}}),i=r,o=n("2877"),l=n("6544"),c=n.n(l),u=n("8336"),d=n("132d"),p=n("3a2f"),f=Object(o["a"])(i,a,s,!1,null,null,null);t["a"]=f.exports;c()(f,{VBtn:u["a"],VIcon:d["a"],VTooltip:p["a"]})},ddc1:function(e,t,n){"use strict";n.r(t);var a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("list-page-top",{attrs:{breads:e.breads}}),n("div",{staticStyle:{display:"flex","flix-direction":"row"}},[n("v-card",{staticClass:"mr-2 pa-2",staticStyle:{width:"300px"}},[n("v-expansion-panels",{staticClass:"mb-6",attrs:{multiple:""}},[n("v-expansion-panel",[n("v-expansion-panel-header",{attrs:{"expand-icon":"mdi-menu-down"}},[e._v(" Agents ")]),n("v-expansion-panel-content",[n("v-checkbox",{attrs:{"x-small":"",dense:"",label:"Select All"},model:{value:e.selectedAllAgents,callback:function(t){e.selectedAllAgents=t},expression:"selectedAllAgents"}}),n("v-divider",{staticClass:"pb-4"}),e._l(e.agents,(function(t){return n("v-checkbox",{key:t.session_id,attrs:{value:t.session_id,"x-small":"",dense:"",label:t.name},on:{change:e.handleFilterChange},model:{value:e.selectedAgents,callback:function(t){e.selectedAgents=t},expression:"selectedAgents"}})}))],2)],1),n("v-expansion-panel",[n("v-expansion-panel-header",{attrs:{"expand-icon":"mdi-menu-down"}},[e._v(" Users ")]),n("v-expansion-panel-content",[n("v-checkbox",{attrs:{"x-small":"",dense:"",label:"Select All"},model:{value:e.selectedAllUsers,callback:function(t){e.selectedAllUsers=t},expression:"selectedAllUsers"}}),n("v-divider",{staticClass:"pb-4"}),e._l(e.users,(function(t){return n("v-checkbox",{key:t.id,attrs:{value:t.id,"x-small":"",dense:"",label:t.username},on:{change:e.handleFilterChange},model:{value:e.selectedUsers,callback:function(t){e.selectedUsers=t},expression:"selectedUsers"}})}))],2)],1)],1)],1),n("v-card",{staticStyle:{"flex-grow":"1"}},[n("v-pagination",{attrs:{length:e.totalPages,"total-visible":10},on:{input:e.handlePageChange},model:{value:e.currentPage,callback:function(t){e.currentPage=t},expression:"currentPage"}}),n("v-data-table",{attrs:{headers:e.headers,items:e.tasks,"item-key":"id","sort-by":e.sortBy,"sort-desc":e.sortDesc,"server-items-length":e.totalItems,"footer-props":{"items-per-page-options":[10,25,50,100]},"items-per-page":e.itemsPerPage,loading:e.loading,page:e.currentPage,"show-expand":""},on:{"update:itemsPerPage":function(t){e.itemsPerPage=t},"update:items-per-page":function(t){e.itemsPerPage=t},"update:options":e.handleOptionsChange},scopedSlots:e._u([{key:"expanded-item",fn:function(t){var a=t.headers,s=t.item;return[n("td",{attrs:{colspan:a.length}},[n("div",[n("div",{staticClass:"pt-2"},[n("tooltip-button",{attrs:{icon:s.expandedInput?"fa-minus":"fa-plus",text:"See Full Input","x-small":""},on:{click:function(t){return e.toggleSeeFullInput(s)}}})],1),n("p",[n("b",[e._v("Task Input:")])]),n("p",{staticClass:"mono",staticStyle:{"max-width":"900px"}},[e._v(" "+e._s(s.expandedInput?e.expandedTasks[s.id].full_input:s.input)+" ")]),n("p",[n("b",[e._v("Task Output:")])]),n("p",{staticClass:"mono",staticStyle:{"max-width":"900px"}},[e._v(" "+e._s(s.output)+" ")])])])]}},{key:"item.status",fn:function(t){var a=t.item;return["pulled"===a.status?n("v-icon",{attrs:{color:"green",small:""}},[e._v(" fa-check-square ")]):"queued"===a.status?n("v-icon",{attrs:{color:"orange",small:""}},[e._v(" fa-clock ")]):e._e()]}},{key:"item.input",fn:function(t){var a=t.item;return[n("span",[e._v(e._s(e.truncateMessage(a.input)))])]}},{key:"item.updated_at",fn:function(t){var a=t.item;return[n("v-tooltip",{attrs:{top:""},scopedSlots:e._u([{key:"activator",fn:function(t){var s=t.on;return[n("span",e._g({},s),[e._v(e._s(e.moment(a.updated_at).fromNow()))])]}}],null,!0)},[n("span",[e._v(e._s(e.moment(a.updated_at).format("MMM D YYYY, h:mm:ss a")))])])]}},{key:"item.actions",fn:function(t){var a=t.item;return[n("v-menu",{attrs:{"offset-y":""},scopedSlots:e._u([{key:"activator",fn:function(t){var a=t.on,s=t.attrs;return[n("v-btn",e._g(e._b({attrs:{text:"",icon:"","x-small":""}},"v-btn",s,!1),a),[n("v-icon",[e._v("fa-ellipsis-v")])],1)]}}],null,!0)},[n("v-list",{staticClass:"ml-2 mr-2"},[n("v-list-item",{key:"downloadInput",attrs:{link:""},on:{click:function(t){return e.downloadInput(a)}}},[n("v-list-item-title",[n("v-icon",[e._v("fa-download")]),e._v(" Download Input ")],1)],1),e.hasOutput(a)?n("v-list-item",{key:"downloadOutput",attrs:{link:""},on:{click:function(t){return e.downloadOutput(a)}}},[n("v-list-item-title",[n("v-icon",[e._v("fa-download")]),e._v(" Download Output ")],1)],1):e._e(),n("v-list-item",{key:"clipboardInput",attrs:{link:""},on:{click:function(t){return e.copyInput(a)}}},[n("v-list-item-title",[n("v-icon",[e._v("fa-paperclip")]),e._v(" Copy Input to Clipboard ")],1)],1),e.hasOutput(a)?n("v-list-item",{key:"clipboardOutput",attrs:{link:""},on:{click:function(t){return e.copyOutput(a)}}},[n("v-list-item-title",[n("v-icon",[e._v("fa-paperclip")]),e._v(" Copy Output to Clipboard ")],1)],1):e._e(),n("v-spacer"),e._l(a.downloads,(function(t){return n("v-list-item",{key:"download-"+t.id,attrs:{link:""},on:{click:function(n){return e.downloadFile(t)}}},[n("v-list-item-title",[n("v-icon",[e._v("fa-download")]),e._v(" Download "+e._s(t.file_name)+" ")],1)],1)}))],2)],1)]}}])})],1)],1)],1)},s=[],r=n("1da1"),i=n("5530"),o=(n("96cf"),n("d81d"),n("d3b7"),n("3ca3"),n("ddb0"),n("99af"),n("2f62")),l=n("c1df"),c=n.n(l),u=n("2b0e"),d=n("230e"),p=n("a993"),f=n("828a"),g=n("9442"),v={name:"Reporting",components:{ListPageTop:f["a"],TooltipButton:g["a"]},data:function(){return{breads:[{text:"Reporting",disabled:!0,href:"/reporting"}],selectedAgents:[],selectedUsers:[],tasks:[],currentPage:1,totalPages:1,totalItems:0,itemsPerPage:10,loading:!1,moment:c.a,sortBy:"updated_at",sortDesc:!0,refreshInterval:null,expandedTasks:{},headers:[{text:"Task ID",value:"id",sortable:!0},{text:"Status",value:"status",sortable:!0},{text:"Agent",value:"agent_id",sortable:!0},{text:"Task Input",value:"input",sortable:!1},{text:"Task Name",value:"task_name",sortable:!1},{text:"User",value:"username",sortable:!1},{text:"Updated At",value:"updated_at",sortable:!0},{text:"Actions",value:"actions",sortable:!1}]}},computed:Object(i["a"])(Object(i["a"])({},Object(o["c"])({agents:function(e){return e.agent.agents},users:function(e){return e.user.users}})),{},{selectedAllAgents:{set:function(e){this.selectedAgents=e?this.agents.map((function(e){return e.session_id})):[],this.getTasks()},get:function(){return this.selectedAgents.length===this.agents.length}},selectedAllUsers:{set:function(e){this.selectedUsers=e?this.users.map((function(e){return e.id})):[],this.getTasks()},get:function(){return this.selectedUsers.length===this.users.length}}}),mounted:function(){var e=this;return Object(r["a"])(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return t.next=2,Promise.all([e.$store.dispatch("agent/getAgents"),e.$store.dispatch("user/getUsers")]);case 2:e.selectedAgents=e.agents.map((function(e){return e.session_id})),e.selectedUsers=e.users.map((function(e){return e.id})),e.getTasks();case 5:case"end":return t.stop()}}),t)})))()},methods:{truncateMessage:function(e){return e?e.length>30?"".concat(e.substr(0,30),"..."):e:""},isDownload:function(e){return e.downloads&&e.downloads.length>0},downloadFile:function(e){p["b"](e.id)},hasOutput:function(e){return!!e.output},downloadInput:function(e){var t=this;return Object(r["a"])(regeneratorRuntime.mark((function n(){var a;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:if(!e.input){n.next=7;break}if(t.expandedTasks[e.id]){n.next=6;break}return n.next=4,d["f"](e.agent_id,e.id);case 4:a=n.sent,t.expandedTasks[e.id]=a;case 6:t.downloadText(t.expandedTasks[e.id].full_input,"".concat(e.agent_id,"-").concat(e.id,"-input.txt"));case 7:case"end":return n.stop()}}),n)})))()},downloadOutput:function(e){e.output&&this.downloadText(e.output,"".concat(e.agent_id,"-").concat(e.id,"-output.txt"))},copyInput:function(e){var t=this;return Object(r["a"])(regeneratorRuntime.mark((function n(){var a;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:if(!e.input){n.next=7;break}if(t.expandedTasks[e.id]){n.next=6;break}return n.next=4,d["f"](e.agent_id,e.id);case 4:a=n.sent,t.expandedTasks[e.id]=a;case 6:navigator.clipboard.writeText(t.expandedTasks[e.id].full_input);case 7:case"end":return n.stop()}}),n)})))()},copyOutput:function(e){e.output&&navigator.clipboard.writeText(e.output)},toggleSeeFullInput:function(e){var t=this;return Object(r["a"])(regeneratorRuntime.mark((function n(){var a;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:if(t.expandedTasks[e.id]){n.next=8;break}return n.next=3,d["f"](e.agent_id,e.id);case 3:a=n.sent,t.expandedTasks[e.id]=a,e.expandedInput=!0,n.next=9;break;case 8:e.expandedInput=!e.expandedInput;case 9:u["default"].set(t.tasks,t.tasks.indexOf(e),e);case 10:case"end":return n.stop()}}),n)})))()},getTasks:function(){var e=this;return Object(r["a"])(regeneratorRuntime.mark((function t(){var n,a;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(0!==e.selectedAgents.length){t.next=6;break}return e.tasks=[],e.currentPage=1,e.totalPages=1,e.totalItems=0,t.abrupt("return");case 6:return e.loading=!0,n=null,e.selectedAgents.length>0&&(n=e.selectedAgents),t.next=11,d["g"](n,{page:e.currentPage,limit:e.itemsPerPage,sortBy:e.sortBy,sortOrder:e.sortDesc?"desc":"asc",users:e.selectedUsers});case 11:a=t.sent,e.currentPage=a.page,e.totalPages=a.total_pages,e.totalItems=a.total,e.tasks=a.records.map((function(t){return e.expandedTasks[t.id]&&(t.expandedInput=!0),t})),e.tasks=a.records,e.loading=!1;case 18:case"end":return t.stop()}}),t)})))()},handleFilterChange:function(){this.getTasks()},handlePageChange:function(e){this.currentPage=e,this.getTasks()},handleOptionsChange:function(e){this.currentPage=e.page,this.itemsPerPage=e.itemsPerPage,e.sortBy.length>0?(this.sortBy=e.sortBy[0],this.sortDesc=e.sortDesc[0]):(this.sortBy="id",this.sortDesc=!0),"agent_id"===this.sortBy&&(this.sortBy="agent"),this.getTasks()}}},m=v,h=(n("8f48"),n("2877")),x=n("6544"),b=n.n(x),_=n("8336"),k=n("b0af"),w=n("ac7c"),y=n("8fea"),T=n("ce7e"),P=n("cd55"),A=n("49e2"),C=n("c865"),I=n("0393"),O=n("132d"),S=n("8860"),V=n("da13"),B=n("5d23"),D=n("e449"),U=n("891e"),R=n("2fa4"),j=n("3a2f"),L=Object(h["a"])(m,a,s,!1,null,null,null);t["default"]=L.exports;b()(L,{VBtn:_["a"],VCard:k["a"],VCheckbox:w["a"],VDataTable:y["a"],VDivider:T["a"],VExpansionPanel:P["a"],VExpansionPanelContent:A["a"],VExpansionPanelHeader:C["a"],VExpansionPanels:I["a"],VIcon:O["a"],VList:S["a"],VListItem:V["a"],VListItemTitle:B["c"],VMenu:D["a"],VPagination:U["a"],VSpacer:R["a"],VTooltip:j["a"]})}}]);
//# sourceMappingURL=reporting.fec42b48.js.map