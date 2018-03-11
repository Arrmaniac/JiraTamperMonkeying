// ==UserScript==
// @name         JIRA Fixes
// @namespace    http://arrmaniac.de
// @version      0.4a
// @downloadURL    none yet
// @description  try to take over the world!
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @match        name your JIRA domain
// @run-at       document-idle
// ==/UserScript==

(function(){
  'use strict';
  jiraFixes = {
    jQuery:jQuery,
    init: function(){},
    sortIssuesInEpic: function(columnContentElementPath, contentProperty, reverse) {
      var $ = this.jQuery;
      var $tbody = $('#ghx-issues-in-epic-table tbody');
      var issuesInEpic = $tbody.find('tr.issuerow').get();
      
      issuesInEpic.sort(function(a,b){
        var a_value = $(a).find('td.'+ columnContentElementPath).first().prop(contentProperty);
        var b_value = $(b).find('td.'+ columnContentElementPath).first().prop(contentProperty);

        if (reverse) {
            return (a_value > b_value) ? -1 : 1;
        } else {
            return (a_value < b_value) ? -1 : 1;
        }
      });
      
      $.each(issuesInEpic, function(index, row){$tbody.append(row);});
    }
  };
  
  jiraFixes.init();
})();
