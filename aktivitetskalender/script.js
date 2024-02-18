document.addEventListener('DOMContentLoaded', function (event) {
    updateCalendar();
});

const calendarUrl = 'https://docs.google.com/spreadsheets/d/11U4UaSJ2E2UtMank4X_qJla8lfju5UwxVug1J26TT_Y/gviz/tq?tqx=out:json&tq&gid=0';


function updateCalendar() {
    let request = new XMLHttpRequest();
    request.open('GET', calendarUrl, true);
    //request.setRequestHeader('X-DataSource-Auth', true);
    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            renderCalendar(request.responseText);
        } else {
            errorMessage('Kunne ikke hente kalenderdata, responskoden var:' + request.status);
        }
    };
    request.onerror = function () {
        errorMessage('Kunne ikke hente kalenderdata, ukjent feil.');
    };
    request.send();
}

function errorMessage(message) {
    document.getElementById('calendarContainer').innerHTML = message;
}

function renderCalendar(responseText) {
    responseText = cleanUpResponse(responseText);
    let data = JSON.parse(responseText);
    const cols = data.table.cols;
    const rows = data.table.rows;

    let tableHTML = '<table border="1"><thead><tr>';

    cols.forEach(col => {
        tableHTML += `<th>${col.label}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    rows.forEach(row => {
        tableHTML += '<tr>';
        row.c.forEach(cell => {
            tableHTML += `<td>${cell.v ? cell.v : ''}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    

    let div = document.createElement("div");
    div.innerHTML = tableHTML;
    document.body.appendChild(div);

}

function cleanUpResponse(responseText){
    responseText = responseText.replace('/*O_o*/','');
    responseText = responseText.replace('google.visualization.Query.setResponse(','');
    responseText = responseText.slice(0, -2);
    return responseText;
}