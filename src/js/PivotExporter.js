/*global define, document, window, alert*/
define(['jquery', 'loglevel', 'swal', 'underscore.string', 'FileSaver'], function ($, log, swal, S) {

    'use strict';

    function PIVOTEXPORTER(config) {

        this.CONFIG = {
            placeholder_id: 'placeholder',
            filename: 'PivotExport',
            url_csv2excel: 'http://localhost:8080/api/v1.0/csv2excel/',
            url_output: 'http://localhost:8080/api/v1.0/excels/'
        };

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        if (this.CONFIG.hasOwnProperty('container')) {
            this.$CONTAINER = $(this.CONFIG.container);
        }else {
            this.$CONTAINER = $('#' + this.CONFIG.placeholder_id);
        }

    }

    PIVOTEXPORTER.prototype.excel = function (metadata) {
        var model = this.create_model(),
            csv_string = this.create_csv_string(model),
            that = this;
        $.ajax({
            type: 'POST',
            url: this.CONFIG.url_csv2excel,
            data: {
                csv: csv_string,
                filename: this.CONFIG.filename,
                metadata: metadata !== null ? metadata : '"Datasource", "FAOSTAT"\n"Domain Name", "Production, Crops"\n"Retrieved", ' + new Date()
            },
            success: function (response) {
                if (window.open(that.CONFIG.url_output + response, '_blank') === undefined) {
                    swal('Warning', 'Your browser is blocking pop-up windows. Please change your browser settings and try again.', 'warning');
                }
            },
            error: function (e) {
                alert('PIVOTEXPORTER.prototype.excel ' + e);
            }
        });
    };

    PIVOTEXPORTER.prototype.csv = function () {

        // TODO: FIX IT
/*        var model = this.create_model(),
            csv_string = this.create_csv_string(model),
            csvContent = 'data:text/csv;charset=utf-8,' + csv_string,
            encodedUri = encodeURI(csvContent),
            link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', this.CONFIG.filename);
        link.click();*/

        var start = new Date();

        var model = this.create_model(),
            csv_string = this.create_csv_string(model);

        // TODO: check if it works in all browser. There should be an issue with Sfari 8.0

        // TODO: fix name of the filename
        var blob = new Blob([csv_string], {type: "data:application/csv;charset=utf-8;"}),
            d = new Date(),
            filename = "FAOSTAT_Export_" + (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear() + '.csv';

        log.info('EXPORT.saveAs;');

        saveAs(blob, filename);

        var time = new Date();

        log.info("Export.saveAs; Execution saveAs time: ", (time - start) / 1000 + "s");


    };

    PIVOTEXPORTER.prototype.create_model = function () {

        /* Variables. */
        var z_titles = [],
            summary = [],
            values = [],
            ys = [],
            xs = [],
            i,
            tmp,
            y,
            top_titles,
            top_titles_objs,
            z_titles_objs,
            x,
            left_titles,
            left_titles_objs,
            tds,
            count,
            newrow,
            summary_objs;

        /* Collect Y dimension. */
        for (y = 1; y <= this.count_ys(); y += 1) {
            top_titles = [];
            top_titles_objs = this.$CONTAINER.find('table.pivot tbody tr th.draggable.toptitle.targetY' + y);
            for (i = 0; i < top_titles_objs.length; i += 1) {
                if ($.inArray($(top_titles_objs[i]).html().trim(), top_titles) < 0) {
                    top_titles.push(this.remove_html($(top_titles_objs[i]).html().trim()));
                }
            }
            ys.push(top_titles);
        }

        /* Collect Z dimension. */
        z_titles_objs = this.$CONTAINER.find('table.pivot tbody tr th.draggable.ztitle');
        for (i = 0; i < z_titles_objs.length; i += 1) {
            if ($.inArray($(z_titles_objs[i]).html().trim(), z_titles) < 0) {
                z_titles.push(this.remove_html($(z_titles_objs[i]).html().trim()));
            }
        }

        /* Collect X dimension. */
        for (x = 1; x <= this.count_xs(); x += 1) {
            left_titles = [];
            left_titles_objs = this.$CONTAINER.find('table.pivot tbody tr th.draggable.lefttitle.targetX' + x);
            for (i = 0; i < left_titles_objs.length; i += 1) {
                tmp = $(left_titles_objs[i]).html().trim();
                tmp = tmp.substring(tmp.indexOf('</a>'));

                if (S.startsWith(tmp, '</a>')) {
                    tmp = tmp.substring(tmp.indexOf('</a>') + '</a>'.length);
                }

                tmp = tmp.replace(/\n/g, ' ');
                if ($.inArray(tmp, left_titles) < 0) {
                    left_titles.push(tmp);
                }
            }
            xs.push(left_titles);
        }

        /* Collect values. */
        tds = this.$CONTAINER.find('table.pivot tbody tr td');
        count = 1;
        tmp = [];
        newrow = top_titles.length * z_titles.length;
        for (i = 0; i < tds.length; i += 1) {
            tmp.push(this.remove_html($(tds[i]).html().trim()));
            if (count % newrow === 0) {
                values.push(tmp);
                tmp = [];
            }
            count += 1;
        }

        /* Collect summary. */
        summary_objs = this.$CONTAINER.find('table.pivot tbody tr td.summary');
        for (i = 0; i < summary_objs.length; i += 1) {
            summary.push(this.remove_html($(summary_objs[i]).html().trim()));
        }

        /* Return model. */
        return {
            ys: ys,
            xs: xs,
            values: values,
            summary: summary,
            zs: z_titles
        };

    };

    PIVOTEXPORTER.prototype.remove_html = function (html) {
        var tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    PIVOTEXPORTER.prototype.create_csv_string = function (model) {

        log.info(model);

        var s = '',
            i,
            j,
            z,
            y,
            newrow,
            p,
            value;

        /* Create header. */
        for (i = 0; i < model.xs.length; i += 1) {
            s += '"",';
        }
        for (i = 0; i < model.ys.length; i += 1) {
            y = model.ys[i];
            for (j = 0; j < y.length; j += 1) {
                for (z = 0; z < model.zs.length; z += 1) {
                    log.info(y[j]);
                    s += '"' + y[j] + '",';
                }
            }
            s = s.substring(0, s.length - 1);
        }
        s += '\n';
        for (i = 0; i < model.xs.length; i += 1) {
            s += '"",';
        }
        for (i = 0; i < model.ys.length; i += 1) {
            y = model.ys[i];
            for (z = 0; z < y.length; z += 1) {
                for (j = 0; j < model.zs.length; j += 1) {
                    log.info(model.zs[j]);
                    s += '"' + model.zs[j] + '"';
                    if (j < model.zs.length - 1) {
                        s += ',';
                    }
                }
                if (z < y.length - 1) {
                    s += ',';
                }
            }
        }
        s += '\n';

        /* Create body. */
        for (j = 0; j < model.values.length - 1; j += 1) {
            for (z = 0; z < model.xs.length; z += 1) {
                newrow = 1;
                for (p = (1 + z); p < model.xs.length; p += 1) {
                    newrow *= model.xs[p].length;
                }
                s += '"' + model.xs[z][parseInt(j / newrow, 10) % model.xs[z].length] + '",';
            }
            for (i = 0; i < model.values[j].length; i += 1) {
                // TODO: remove it!
                /*value = parseFloat(model.values[j][i]);
                if (!isNaN(value)) {
                    s += '"' + value + '"';
                } else {
                    s += '"' + model.values[j][i] + '"';
                }*/
                s += '"' + model.values[j][i] + '"';
                if (i < model.values[j].length - 1) {
                    s += ',';
                }
            }
            s += '\n';
        }

        return s;

    };

    PIVOTEXPORTER.prototype.count_xs = function () {
        var tmp, i;
        for (i = 1; i < 100; i += 1) {
            tmp = this.$CONTAINER.find('table.pivot tbody tr th.draggable.lefttitle.targetX' + i);
            if (tmp.length === 0) {
                return (i - 1);
            }
        }
    };

    PIVOTEXPORTER.prototype.count_ys = function () {
        var tmp, i;
        for (i = 1; i < 100; i += 1) {
            tmp = this.$CONTAINER.find('table.pivot tbody tr th.draggable.toptitle.targetY' + i);
            if (tmp.length === 0) {
                return (i - 1);
            }
        }
    };

    return PIVOTEXPORTER;

});