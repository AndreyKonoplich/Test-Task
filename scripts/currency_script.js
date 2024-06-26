var uri = 'https://api.nbrb.by/';

$(document).ready(function() {

    loadCurrencyList();

    loadCurrencyListForConverter();

    $('#currencyByDateForm').submit(function(event) {
        event.preventDefault();
        $('#res').empty();
        rates(0);
    });

    $('#dynamicCurrencyForm').submit(function(event) {
        event.preventDefault();
        $('#res2').empty();
        ratedyn();
    });

    $('#currencyConverterForm').on('input', function() {

        convertCurrency();
    });

    $('#shareButton1').on('click', function(event) {
        event.preventDefault();
        generateShareLink('screen1');
    });

    $('#shareButton2').on('click', function(event) {
        event.preventDefault();
        generateShareLink('screen2');
    });

    $('#shareButton3').on('click', function(event) {
        event.preventDefault();
        generateShareLink('screen3');
    });

    displayBrowserInfo();

});

function rates(p) {
    $.getJSON(uri + 'ExRates/Rates', { 'onDate': $('#dateInput').val(), 'Periodicity': p })
    .done(function(data) {
        $('#res').empty();

        var gridContainer = $('<div>', { class: 'currency-grid' });

        data.forEach(function(currency) {
            var officialRate = currency.Cur_OfficialRate.toFixed(4);
            var currencyName = currency.Cur_Name;
            var scale = currency.Cur_Scale; 

            var gridItem = $('<div>', { class: 'currency-grid-item' });
            var nameElem = $('<span>', { class: 'currency-name', text: `${currencyName} (${scale})` });
            var rateElem = $('<span>', { class: 'currency-rate', text: `= ${officialRate}` });
            gridItem.append(nameElem).append(rateElem);

            gridContainer.append(gridItem);
        });

        $('#res').append(gridContainer);
        $('#btn').removeAttr("disabled");
    })
    .fail(function(err) {
        $('#btn').removeAttr("disabled");
        console.error('Ошибка при загрузке данных:', err);
        alert('Ошибка при загрузке данных');
    });
}




function loadCurrencyList() {
    $.getJSON(uri + 'exrates/currencies')
    .done(function(data) {
        var select = $('#currencySelect');
        select.empty();
        data.forEach(function(currency) {
            var option = $('<option>', {
                value: currency.Cur_Abbreviation,
                'data-abbreviation': currency.Cur_Abbreviation,
                text: currency.Cur_Abbreviation + ' - ' + currency.Cur_Name
            });
            select.append(option);
        });
    })
    .fail(function(err) {
        console.error('Ошибка при загрузке списка валют:', err);
        alert('Ошибка при загрузке списка валют');
    });
}

function ratedyn() {
    var startDate = $('#startDateInput').val();
    var endDate = $('#endDateInput').val();
    var currencyAbbreviation = $('#currencySelect option:selected').data('abbreviation');

    if (!startDate || !endDate || !currencyAbbreviation) {
        alert('Пожалуйста, заполните все поля корректно.');
        return;
    }

    $.getJSON(uri + 'ExRates/Currencies')
        .done(function(data) {
            var currencyId = null;

            data.forEach(function(currency) {
                if (currency.Cur_Abbreviation === currencyAbbreviation) {
                    currencyId = currency.Cur_ID;
                    return false;
                }
            });

            if (currencyId === null) {
                alert('Валюта с такой аббревиатурой не найдена.');
                return;
            }

            $.getJSON(uri + 'ExRates/Rates/Dynamics/' + currencyId, {
                'startDate': startDate,
                'endDate': endDate
            })
            .done(function(data) {
                console.log(data);
                $('#res2').empty();

                data.forEach(function(item, index) {
                    var officialRate = item.Cur_OfficialRate.toFixed(4);
                    var date = new Date(item.Date);
                    var formattedDate = formatDate(date);
                    var currencyName = currencyAbbreviation;

                    var currencyInfo = `${formattedDate} = <span style="color: #159c37;">${officialRate}</span>`;

                    var listItem = $('<div>', { class: 'currency-item' });
                    var dateElem = $('<span>', { class: 'currency-date', html: currencyInfo });

                    listItem.append(dateElem);
                    $('#res2').append(listItem);
                });

                $('#btn').removeAttr("disabled");
            })
            .fail(function(err) {
                console.error('Ошибка при загрузке данных:', err);
                alert('Ошибка при загрузке данных');
                $('#btn').removeAttr("disabled");
            });
        })
        .fail(function(err) {
            console.error('Ошибка при загрузке списка валют:', err);
            alert('Ошибка при загрузке списка валют');
        });
}




function convertCurrency() {
    var currencyFromAbbreviation = $('#currencyFrom').val();
    var currencyToAbbreviation = $('#currencyTo').val();
    var amount = parseFloat($('#amount').val());

    $.getJSON(uri + 'ExRates/Currencies')
    .done(function(data) {
        var currencyFromId = null;
        var currencyToId = null;

        data.forEach(function(currency) {
            if (currency.Cur_Abbreviation === currencyFromAbbreviation) {
                currencyFromId = currency.Cur_ID;
                return false; 
            }
        });

        data.forEach(function(currency) {
            if (currency.Cur_Abbreviation === currencyToAbbreviation) {
                currencyToId = currency.Cur_ID;
                return false;
            }
        });

        $.when(
            $.getJSON(uri + 'ExRates/Rates/' + currencyFromId),
            $.getJSON(uri + 'ExRates/Rates/' + currencyToId)
        )
        .done(function(rateFromData, rateToData) {
            var rateFrom = rateFromData[0].Cur_OfficialRate;
            var rateTo = rateToData[0].Cur_OfficialRate;

            var convertedAmount = (amount * rateFrom / rateTo).toFixed(2);

            if (!isNaN(amount)) {
                $('#conversionResult').text(`${amount} ${currencyFromAbbreviation} = ${convertedAmount} ${currencyToAbbreviation}`);
            } else {
                $('#conversionResult').text('');
            }
            
        })
        .fail(function(err) {
            console.error('Ошибка при загрузке данных для конвертации:', err);
            $('#conversionResult').text('Ошибка при загрузке данных для конвертации');
        });

    })
    .fail(function(err) {
        console.error('Ошибка при загрузке данных:', err);
        alert('Произошла ошибка при загрузке данных');
    });
}


function formatDate(date) {
    var day = ('0' + date.getDate()).slice(-2); 
    var month = ('0' + (date.getMonth() + 1)).slice(-2); 
    var year = date.getFullYear();
    return day + '.' + month + '.' + year;
}

function loadCurrencyListForConverter() {
    $.getJSON(uri + 'exrates/currencies')
    .done(function(data) {
        var selectFrom = $('#currencyFrom');
        var selectTo = $('#currencyTo');

        selectFrom.empty();
        selectTo.empty();

        data.forEach(function(currency) {
            var option = $('<option>', {
                value: currency.Cur_Abbreviation,
                'data-abbreviation': currency.Cur_Abbreviation,
                text: currency.Cur_Abbreviation + ' - ' + currency.Cur_Name
            });
            selectFrom.append(option.clone());
            selectTo.append(option);
        });

        selectFrom.val('USD');
        selectTo.val('EUR');

        convertCurrency();
    })
    .fail(function(err) {
        console.error('Ошибка при загрузке списка валют:', err);
        alert('Ошибка при загрузке списка валют');
    });
}

function showScreen(screenId) {
    $('.screen').hide().removeClass('active'); 
    $('#' + screenId).show().addClass('active'); 
}

function generateShareLink(screenId) {
    var shareLink;
    var screenTitle;

    switch (screenId) {
        case 'screen1':
            var selectedDate = $('#dateInput').val();
            if (!selectedDate) {
                alert('Выберите дату для создания ссылки.');
                return;
            }
            shareLink = window.location.origin + window.location.pathname + '#screen1?date=' + selectedDate;
            screenTitle = 'Курс валют за день';
            break;
        case 'screen2':
            var startDate = $('#startDateInput').val();
            var endDate = $('#endDateInput').val();
            var currencyAbbreviation = $('#currencySelect').val();
            if (!startDate || !endDate || !currencyAbbreviation) {
                alert('Пожалуйста, заполните все поля корректно.');
                return;
            }
            shareLink = window.location.origin + window.location.pathname + '#screen2?start=' + startDate + '&end=' + endDate + '&currency=' + currencyAbbreviation;
            screenTitle = 'Динамика курса';
            break;
        case 'screen3':
            var currencyFrom = $('#currencyFrom').val();
            var currencyTo = $('#currencyTo').val();
            var amount = $('#amount').val();
            var conversionResult = $('#conversionResult').text();

            if (!currencyFrom || !currencyTo || !amount) {
                alert('Введите все параметры для создания ссылки.');
                return;
            }

            shareLink = window.location.origin + window.location.pathname +
                        '#screen3?from=' + encodeURIComponent(currencyFrom) +
                        '&to=' + encodeURIComponent(currencyTo) +
                        '&amount=' + encodeURIComponent(amount) +
                        '&result=' + encodeURIComponent(conversionResult);
            screenTitle = 'Конвертер валют';
            break;
        default:
            alert('Неизвестный экран для создания ссылки: ' + screenId);
            return;
    }

    navigator.clipboard.writeText(shareLink).then(function() {
        var snackbar = document.getElementById("snackbar");
        snackbar.className = "show";
        setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
        alert('Ссылка на экран "' + screenTitle + '" скопирована в буфер обмена.');
    }, function(err) {
        console.error('Ошибка при копировании в буфер обмена:', err);
        alert('Ошибка при копировании ссылки в буфер обмена.');
    });
}

function getQueryParams() {
    var params = {};
    var queryString = window.location.hash.substring(1);
    var regex = /([^&=]+)=([^&]*)/g;
    var m;
    while (m = regex.exec(queryString)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;
}

$(document).ready(function() {
    var params = getQueryParams();
    if (params.date) {
        $('#dateInput').val(params.date);
    }
    if (params.start && params.end && params.currency) {
        $('#startDateInput').val(params.start);
        $('#endDateInput').val(params.end);
        $('#currencySelect').val(params.currency);
    }
    if (params.from && params.to && params.amount) {
        $('#currencyFrom').val(params.from);
        $('#currencyTo').val(params.to);
        $('#amount').val(params.amount);
        $('#conversionResult').text(params.result);
    }
});

function getBrowserInfo() {
    var ua = navigator.userAgent;
    var browserName, fullVersion;

    if ((offset = ua.indexOf("Opera")) != -1) {
        browserName = "Opera";
        fullVersion = ua.substring(offset + 6);
        if ((offset = ua.indexOf("Version")) != -1) {
            fullVersion = ua.substring(offset + 8);
        }
    } else if ((offset = ua.indexOf("MSIE")) != -1) {
        browserName = "Microsoft Internet Explorer";
        fullVersion = ua.substring(offset + 5);
    } else if ((offset = ua.indexOf("Chrome")) != -1) {
        browserName = "Chrome";
        fullVersion = ua.substring(offset + 7);
    } else if ((offset = ua.indexOf("Safari")) != -1) {
        browserName = "Safari";
        fullVersion = ua.substring(offset + 7);
        if ((offset = ua.indexOf("Version")) != -1) {
            fullVersion = ua.substring(offset + 8);
        }
    } else if ((offset = ua.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
        fullVersion = ua.substring(offset + 8);
    } else if ((nameOffset = ua.lastIndexOf(' ') + 1) <
               (verOffset = ua.lastIndexOf('/'))) {
        browserName = ua.substring(nameOffset, verOffset);
        fullVersion = ua.substring(verOffset + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }

    return browserName + " " + fullVersion;
}

function displayBrowserInfo() {
    var browserInfo = getBrowserInfo();
    $('#browserInfoFooter .browser-info').text('Используемый браузер: ' + browserInfo);
}