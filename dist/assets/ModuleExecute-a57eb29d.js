import{_ as o}from"./AgentExecuteModule-4f0fe455.js";import{_ as n}from"./EditPageTop-cc816a05.js";import{n as m,M as a,c as i}from"./index-58f4050c.js";import{a as u}from"./GeneralForm-65bc43e6.js";import"./TechniqueChips-fbe88c34.js";import"./VSelect-01110476.js";import"./InfoViewer-75425381.js";import"./AuthorChips-ea3f2366.js";import"./VExpansionPanels-6f783ece.js";import"./VItemGroup-01fc0587.js";import"./VExpansionPanelHeader-570c2e65.js";import"./ErrorStateAlert-54a1fc69.js";import"./module-api-a9ca583e.js";import"./module-module-b84fa6b6.js";import"./VDataTable-05bb859a.js";import"./TooltipButton-7f590e14.js";import"./VTooltip-8f539ce9.js";import"./VSwitch-c29d83be.js";import"./bypass-module-c3821ce9.js";import"./bypass-api-dffd101a.js";import"./credential-module-ef0a3e69.js";import"./malleable-module-bc4ffaca.js";import"./malleable-api-929708b6.js";const l={name:"ModuleExecute",components:{AgentExecuteModule:o,EditPageTop:n},data(){return{selectedAgents:[],moduleName:""}},computed:{agentStore(){return a()},agents(){return this.agentStore.agents.filter(t=>t.archived===!1&&t.stale===!1)},breads(){return[{text:"Modules",disabled:!1,to:"/modules",exact:!0},{text:`${this.moduleName}`,disabled:!0,to:"/modules/execute"}]}},mounted(){this.getAgents(),this.moduleName=this.$route.params.id},methods:{submit(){this.$refs.executeform.create()},moduleChange(t){this.moduleName=t,this.$router.push({name:"moduleExecute",params:{id:t}})},getAgents(){this.agentStore.getAgents()},clearAgents(){this.selectedAgents=[]}}};var d=function(){var e=this,s=e._self._c;return s("div",{staticClass:"p4"},[s(n,{attrs:{breads:e.breads,"show-submit":!0},on:{submit:e.submit}}),s("h4",{staticClass:"pl-4 pb-4"},[e._v("Execute Module")]),s(u,{attrs:{dense:"",outlined:"",chips:"",multiple:"",placeholder:"Agents",items:e.agents,"item-text":"name","item-value":"session_id"},model:{value:e.selectedAgents,callback:function(r){e.selectedAgents=r},expression:"selectedAgents"}}),s(i,[s(o,{ref:"executeform",attrs:{"module-name":e.moduleName,agents:e.selectedAgents,"show-submit":!1},on:{moduleChange:e.moduleChange,submitted:e.clearAgents}})],1)],1)},p=[],c=m(l,d,p,!1,null,null,null,null);const q=c.exports;export{q as default};
