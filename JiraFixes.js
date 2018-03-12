// ==UserScript==
// @name         JIRA Fixes
// @namespace    http://arrmaniac.de
// @version      0.5
// @downloadURL    none yet
// @description  try to take over the world!
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @match        name your JIRA domain
// @run-at       document-idle
// ==/UserScript==

(function(){
  'use strict';
config = {
    jiraIssueUrlPrefix: 'set URL prefix here', // something like: https://myjiradomain.com/rest/api/2/issue/
    monkeyscriptUniqID: 'jirafixes'
};

jiraFixes = {
    jQuery:jQuery,
    config: config,
    previousHref: '',
    issueKey: '',
    plugins: [],
    addPlugin: function(plugin){
        this.plugins.push(plugin);
    },
    init: function(){
        this.initRepeatedly();
        this.initPlugins();
        this.initOnceLast();
        console.log('initialized.');
    },
    initRepeatedly: function(){
        this.previousHref = document.location.href;
        this.issueKey = this.getIssueKey();
    },
    initPlugins: function(){
        this.plugins.forEach(function(plugin){
            console.log('Initializing plugin "'+plugin.name+'"...');
            plugin.init(this);
        }, this);
    },
    initOnceLast: function(){
        var bodyList = document.querySelector("body");
        var myself = this;
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (this.previousHref !== document.location.href) {
                    this.previousHref = document.location.href;
                    this.retrigger();
                }
            }, myself);
        });
        var config = {
            childList: true,
            subtree: true
        };
        observer.observe(bodyList, config);
    },
    getMonkeyscriptUniqID: function(){
        return this.config.monkeyscriptUniqID;
    },
    getIssueKey: function(){
        return this.jQuery('.issue-header-content a.issue-link').first().attr('data-issue-key');
    },
    getIssuesInEpicTables: function(){
        return this.jQuery('#ghx-issues-in-epic-table');
    },
    retrigger: function(){
        this.initRepeatedly();
        this.plugins.forEach(function(plugin){
            plugin.retrigger(this);
        }, this);
        console.log('retriggered.');
    }
};

jiraFixes.addPlugin({
    name: 'plugin-template',
    config: {},
    jiraFixes: {},
    init: function(jiraFixes){
        this.jiraFixes = jiraFixes;
    },
    retrigger: function(jiraFixes){
        this.init(jiraFixes);
    }
});

jiraFixes.addPlugin({
    name: 'epicIssuesFilters',
    jiraFixes: {},
    init: function(jiraFixes){
        this.jiraFixes = jiraFixes;
        this.buildTableHeader();
        var $table = this.jiraFixes.getIssuesInEpicTables();
        var myself = this;
        
        $table.on('keyup change', '#'+this.jiraFixes.getMonkeyscriptUniqID()+'_summary_filter_input', function(){
            var filterText = myself.jiraFixes.jQuery(this).val();
            myself.findMatchingSummaries(filterText);
        });
        $table.on('change', '#'+this.jiraFixes.getMonkeyscriptUniqID()+'_show_type_only_filter', function(){
            var typeText = myself.jiraFixes.jQuery(this).val();
            myself.findMatchingIssueTypes(typeText);
        });
        $table.on('click', '#'+this.jiraFixes.getMonkeyscriptUniqID()+'_sort_issues_button', function(){
            var $button = myself.jiraFixes.jQuery(this);
            var state = $button.prop('data-value');
            myself.sortIssuesInEpic('issuetype > img', 'title', (state === '1'));
            $button.prop('data-value', (state === '1') ? '2' : '1');
        });
    },
    buildTableHeader: function(){
        var $table = this.jiraFixes.getIssuesInEpicTables();
        var $ = this.jiraFixes.jQuery;
        if($table.length === 0) console.log('"Vorgänge im Epos"-Tabelle nicht gefunden');

        if($table.find('thead').length === 0){
            var $firstRow = $table.find('tr.issuerow').first();
            var $thead = $('<thead>');
            var $tr = $('<tr>');
            $tr.appendTo($thead);
            $table.prepend($thead);
            var myself = this;
            $firstRow.find('td').each(function(){
                if( $(this).hasClass('issuetype') ){
                    $tr.append( $('<th><button id="jirafixes_sort_issues_button" title="Nach Vorgangstyp sortieren">sort</button></th>') );
                }
                else if( $(this).hasClass('status') ){
                    var $select = myself.buildTypefilter();
                    $('<th>').append($select).appendTo($tr);
                }
                else if( $(this).hasClass('ghx-summary') ){
                    var $input = myself.buildSummaryfilter();
                    $('<th>').append($input).appendTo($tr);
                } else {
                    $tr.append( $('<th></th>') );
                }
            });
        } else {
            console.log('Keine Epos-Vorgänge gefunden');
        }
    },
    findMatchingSummaries: function(filterText){
        var $tbody = this.jiraFixes.getIssuesInEpicTables().find('tbody');
        
        if(filterText === ''){
            $tbody.find('tr.issuerow').show();
        } else {
            var $ = this.jiraFixes.jQuery;
            $tbody.find('tr.issuerow').each(function(){
                var summary = '' + $(this).find('td.ghx-summary').text();
                if(summary.toLowerCase().indexOf(filterText.toLowerCase()) < 0){
                    $(this).hide();
                } else {
                    $(this).show();
                }
            });
        }
    },
    findMatchingIssueTypes: function(typeText){
        var $tbody = this.jiraFixes.getIssuesInEpicTables().find('tbody');
        
        if(typeText === '__all__'){
            $tbody.find('tr.issuerow').show();
        } else {
            var $ = this.jiraFixes.jQuery;
            $tbody.find('tr.issuerow').each(function(){
                var issuetype = '' + $(this).find('td.issuetype > img').first().prop('title');
                if(issuetype !== typeText){
                    $(this).hide();
                } else {
                    $(this).show();
                }
            });
        }
    },
    retrigger: function(jiraFixes){
        this.init(jiraFixes);
    },
    buildSummaryfilter: function(){
        var $input = this.jiraFixes.jQuery('<input type="text" id="'+this.jiraFixes.getMonkeyscriptUniqID()+'_summary_filter_input" placeholder="Vorgangstitel eingeben...">')
              .css({"width":"100%"});

        return $input;
    },
    buildTypefilter: function(){
        var $ = this.jiraFixes.jQuery;
        var $tbody = this.jiraFixes.getIssuesInEpicTables().find('tbody');
        var $select = $('<select id="'+this.jiraFixes.getMonkeyscriptUniqID()+'_show_type_only_filter" title="Nach Vorgangstyp filtern">');
        $select.append( $('<option value="__all__">-- Alle anzeigen --</option>') );
        var options = {};
        $tbody.find('tr.issuerow').each(function(){
            var issuetype = '' + $(this).find('td.issuetype > img').first().prop('title');
            if(!options.hasOwnProperty(issuetype)){
                options[issuetype] = 1;
                $select.append( $('<option value="' + issuetype + '">' + issuetype + '</option>') );
            }
        });

        return $select;
    },
  sortIssuesInEpic: function(columnContentElementPath, contentProperty, reverse){
        var $ = this.jiraFixes.jQuery;
        var $tbody = this.jiraFixes.getIssuesInEpicTables().find('tbody');
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
        $.each(issuesInEpic, function(index, row) {
            $tbody.append(row);
        });
    }
});

jiraFixes.addPlugin({
    name: 'commentFilter',
    config: {
        activityModuleHeadingSelector: '#activitymodule_heading'
    },
    issueComments:[],
    jiraFixes: {},
    init: function(jiraFixes){
        this.jiraFixes = jiraFixes;
        var issueKey = this.jiraFixes.getIssueKey();
        var jiraIssueUrlPrefix = this.jiraFixes.config.jiraIssueUrlPrefix;
        var $activityModuleHeadings = this.get$ActivityModuleHeadings();
        var myself = this;

        if(($activityModuleHeadings.length !== 0) && (issueKey.length > 0)) {
            this.jiraFixes.jQuery.getJSON(jiraIssueUrlPrefix + issueKey + '?fields=comment', function(data){
                myself.issueComments = data.fields.comment.comments;
                $activityModuleHeadings.first().prepend(myself.buildCommentfilter());
                $activityModuleHeadings.first().append(myself.jiraFixes.jQuery('<div id="'+myself.jiraFixes.getMonkeyscriptUniqID()+'_comment_filter_results" class="issuePanelContainer">'));
            });
        }
        
        $activityModuleHeadings.on('keyup change', '#'+this.jiraFixes.getMonkeyscriptUniqID()+'_comment_filter_input', function(){
            var filterText = $(this).val().toLowerCase();
            
            myself.findMatchingComments(filterText);
        });
    },
    retrigger: function(jiraFixes){
        this.init(jiraFixes);
    },
    get$ActivityModuleHeadings: function(){
        return this.jiraFixes.jQuery(this.config.activityModuleHeadingSelector);
    },
    buildCommentfilter: function(){
        var $input = this.jiraFixes.jQuery('<input type="text" id="'+this.jiraFixes.getMonkeyscriptUniqID()+'_comment_filter_input" placeholder="Type some text...">')
                  .css({"width":"100%"});

        return $input;
    },
    findMatchingComments: function(filterText){
        var $ = this.jiraFixes.jQuery;
        var $resultsDiv = $('#'+this.jiraFixes.getMonkeyscriptUniqID()+'_comment_filter_results').first().empty();
        var filteredComments = [];
        var dateFilterCheck = filterText.match(/^(\d{4}(-\d{2}(-\d{2})?)?\w*).*/);
        var dateFilter = '';

        if(!(!dateFilterCheck)) {
            dateFilter = dateFilterCheck[1];
            filterText = filterText.substring( dateFilter.length );
            dateFilter = dateFilter.trim();
        }

        $.each(this.issueComments, function(index, commentObject){
            var commentBody = commentObject.body;
            var commentCreated = commentObject.created;
            var commentUpdated = commentObject.updated;
            var passedTests = true;

            if(dateFilter.length > 0 && commentCreated.indexOf(dateFilter) < 0) {
                passedTests &= false;
            }

            if(commentBody.toLowerCase().indexOf(filterText) < 0) {
                passedTests &= false;
            }

            if(passedTests) {
                filteredComments.push(commentObject);
            }
        });
        //console.log(filteredComments);
        $.each(filteredComments, function(index, commentObject){
            var $comment = $('<div class="issue-data-block activity-comment twixi-block  expanded">');
            var $innerComment = $('<div class="twixi-wrap verbose actionContainer">').appendTo($comment);
            var $commentHead = $('<div class="action-head"><div class="action-details">'+commentObject.author.displayName+' hat einen Kommentar hinzugefügt '+commentObject.created+'</div></div>').appendTo($innerComment);
            var $commentBody = $('<div class="action-body flooded"><p>'+commentObject.body+'</p></div>').appendTo($innerComment);
            $resultsDiv.append($comment);
        });
        
    }
});

jiraFixes.addPlugin({
    name: 'TimeFieldIssues',
    config: {},
    timeFieldIssues: {},
    jiraFixes: {},
    init: function(jiraFixes){
        this.jiraFixes = jiraFixes;
        var myself = this;
        var $ = this.jiraFixes.jQuery;
        var $timeField = $('#datesmodule')
                            .append( $('<div class="mod-content" id="'+this.jiraFixes.getMonkeyscriptUniqID()+'_timechart_div"><button id="'+this.jiraFixes.getMonkeyscriptUniqID()+'_show_timechart_button">Epos-Zeit-Chart anzeigen</button></div>') ); //war mal in #epic-work-time-sum-up
                    
        $timeField.on('click', '#'+this.jiraFixes.getMonkeyscriptUniqID()+'_show_timechart_button', function(){
            var $tbody = myself.jiraFixes.getIssuesInEpicTables().find('tbody');
            $(this).empty().append( $('<progress>') );
            $tbody.find('tr.issuerow').each(function(){
                var issuekey = '' + $(this).attr('data-issuekey');
                
                myself.fetchTimetracking(issuekey);
            });
        });

        $timeField.on('click', 'img', function(){
            var $tr = $(this).parents('tr').first();
            $tr.find('.'+myself.jiraFixes.getMonkeyscriptUniqID()+'_timechart_subtable').slideToggle();
        });
    },
    fetchTimetracking: function(issuekey){
        var url = this.jiraFixes.config.jiraIssueUrlPrefix + issuekey + '?fields=timetracking,issuetype';
        var myself = this;
        this.timeFieldIssues[issuekey] = {};
        this.jiraFixes.jQuery.getJSON(url, function(data){
            var issuekey = data.key;
            myself.timeFieldIssues[issuekey] = data;
            myself.checkTimeFieldIssuesCompletion();
        });
    },
    retrigger: function(jiraFixes){
        this.init(jiraFixes);
    },
    leftPad: function(stringToPad, length, paddingString){
        if(stringToPad.length >= length) return stringToPad;

        var distance = length - stringToPad.length;
        var pad = Array(distance + 1).join(paddingString).substring(0,distance);

        return pad + stringToPad;
    },
    getWorkTime: function(seconds){
        var time = ((seconds / 3600) >= 1) ? Math.floor(seconds / 3600) + 'h ' : '';
        var remainder = seconds % 3600;
        var minutes = ((remainder / 60) >= 1) ? Math.floor(remainder / 60) + 'm ' : ' ';
        var remainingSeconds = remainder % 60 + 's';
        time += this.leftPad(minutes, 4,' ');
        time += this.leftPad(remainingSeconds, 3, ' ');

        return time;
    },
    getTimeFieldIssuesSubTable: function(issues){
        var $subTableDiv = this.jiraFixes.jQuery('<div>');
        var $table = this.jiraFixes.jQuery('<table class="'+this.jiraFixes.getMonkeyscriptUniqID()+'_timechart_subtable">').appendTo($subTableDiv);
        $table.css({
            "position": "absolute",
            "background-color": "white",
            "display": "none",
            "border": "solid 1px grey"
        });
        $table.append( this.jiraFixes.jQuery('<thead><tr><th>Issue</th><th>TimeSpent</th></tr></thead>') );
        var $tbody = this.jiraFixes.jQuery('<tbody>').appendTo($table);

        for(var index in issues){
            var issuekey = issues[index];
            var issue = this.timeFieldIssues[issuekey];
            var $tr = this.jiraFixes.jQuery('<tr>').appendTo($tbody);
            $tr.append( this.jiraFixes.jQuery('<td><a target="_blank" href="/browse/'+issuekey+'">'+issuekey+'</a></td>') );
            $tr.append( this.jiraFixes.jQuery('<td>'+issue.fields.timetracking.timeSpent+'</td>') );
        }

        return $subTableDiv;
    },
    buildTimeFieldIssuesTable: function(){
        var $ = this.jiraFixes.jQuery;
        var $timeChartDiv = $('#'+this.jiraFixes.getMonkeyscriptUniqID()+'_timechart_div').empty();
        var $table = $('<table>').appendTo($timeChartDiv);
        $table.append( $('<thead><tr><th>Type</th><th>Issues</th><th>TimeSpent</th></tr></thead>') );
        var $tbody = $('<tbody>').appendTo($table);
        var types = {};

        for(var index in this.timeFieldIssues){
            var typeName = this.timeFieldIssues[index].fields.issuetype.name;
            var timeSpentSeconds = this.timeFieldIssues[index].fields.timetracking.timeSpentSeconds;

            if(!types.hasOwnProperty(typeName)){
                types[typeName] = {
                    "iconUrl": this.timeFieldIssues[index].fields.issuetype.iconUrl,
                    "timeSpent": 0,
                    "issueCount": 0,
                    "issues": []
                };
            }

            types[typeName].timeSpent += isFinite(timeSpentSeconds) ? parseInt(timeSpentSeconds) : 0;
            types[typeName].issueCount++;
            types[typeName].issues.push(index);
        }

        for(var typeIndex in types){
            var $tr = $('<tr>').appendTo($tbody);
            $tr.append( $('<td><img src="'+types[typeIndex].iconUrl+'" alt="'+typeIndex+'" title="'+typeIndex+'" style="cursor: pointer;" /></td>') );
            $tr.append( $('<td>'+typeIndex+' ('+types[typeIndex].issueCount+')</td>').append( this.getTimeFieldIssuesSubTable(types[typeIndex].issues) ) );
            $tr.append( $('<td style="font-family: monospace; text-align: right; white-space: pre;">'+this.getWorkTime(types[typeIndex].timeSpent)+'</td>') );
        }
    },
    checkTimeFieldIssuesCompletion: function(){
        for(var index in this.timeFieldIssues){
            if(!this.timeFieldIssues[index].hasOwnProperty('fields')) return;
        }

        this.buildTimeFieldIssuesTable();
    }
});

jiraFixes.init();
})();
