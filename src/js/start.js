/*global define*/
define(['jquery',
        'handlebars',
        'text!faostat_ui_pivot/html/templates.hbs',
        'i18n!faostat_ui_pivot/nls/translate',
        'faostat_commons',
        'bootstrap',
        'sweetAlert',
        'amplify',
        'jbPivot'], function ($, Handlebars, templates, translate, FAOSTATCommons) {

    'use strict';

    function PIVOT() {

        this.CONFIG = {

            lang: 'E',
            prefix: 'faostat_ui_pivot_',
            placeholder_id: 'faostat_ui_pivot',
            data: null,
            dsd: null

        };

    }

    PIVOT.prototype.init = function (config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang !== null ? this.CONFIG.lang : 'en';

        /* Store FAOSTAT language. */
        this.CONFIG.lang_faostat = FAOSTATCommons.iso2faostat(this.CONFIG.lang);

        /* Render. */
        this.render();

    };

    PIVOT.prototype.render = function () {

        /* Variables. */
        var source,
            template,
            dynamic_data,
            html,
            that = this,
            i,
            fields = {},
            yfields = [],
            xfields = [],
            zfields = [];

        /* Load main structure. */
        source = $(templates).filter('#faostat_ui_pivot_structure').html();
        template = Handlebars.compile(source);
        dynamic_data = {};
        html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

        /* Configure the pivot according to the DB settings. */
        for (i = 0; i < this.CONFIG.dsd.length; i += 1) {
            switch (this.CONFIG.dsd[i].type) {
            case 'code':
                break;
            case 'flag':
                break;
            case 'value':
                fields[this.CONFIG.dsd[i].label] = {
                    field: this.CONFIG.dsd[i].label,
                    sort: 'asc',
                    showAll: true,
                    aggregateType: 'average',
                    groupType: 'none',
                    formatter: this.pivot_value_formatter
                };
                break;
            default:
                fields[this.CONFIG.dsd[i].label] = {
                    field: this.CONFIG.dsd[i].label,
                    sort: 'asc',
                    showAll: true,
                    aggregateType: 'distinct'
                };
                break;
            }
            if (this.CONFIG.dsd[i].type !== 'code' && this.CONFIG.dsd[i].type !== 'flag') {
                switch (this.CONFIG.dsd[i].pivot) {
                case 'C':
                    yfields.push(this.CONFIG.dsd[i].label);
                    break;
                case 'R':
                    xfields.push(this.CONFIG.dsd[i].label);
                    break;
                case 'V':
                    zfields.push(this.CONFIG.dsd[i].label);
                    break;
                }
            }
        }

        try {
            $('#pivot_placeholder').jbPivot({
                fields: fields,
                yfields: yfields,
                xfields: xfields,
                zfields: zfields,
                data: this.CONFIG.data,
                copyright: false,
                summary: false
            });
        } catch (e) {
            console.debug(e);
        }

    };

    PIVOT.prototype.pivot_value_formatter = function (V) {
        var res = null;
        if (typeof V === 'number') {
            res = V.toFixed(2);
        }
        return res;
    };

    return PIVOT;

});