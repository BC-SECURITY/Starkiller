const a={methods:{async copyStager(o){try{await navigator.clipboard.writeText(o),this.$snack.success("Output copied to clipboard")}catch{this.$snack.warn("Failed to copy to clipboard. You must be on HTTPS or localhost.")}}}};export{a as C};