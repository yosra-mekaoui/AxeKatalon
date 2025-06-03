document.addEventListener('DOMContentLoaded', function() {
    const testSteps = [];
    document.getElementById('newTest').addEventListener('click', createNewTest);
    document.getElementById('runTest').addEventListener('click', runTest);
    document.getElementById('saveTest').addEventListener('click', saveTest);
    function createNewTest() {
        const step = {
            action: 'Click',
            target: '',
            value: ''
        };
        addStepToTable(step);
    }
    function addStepToTable(step) {
        const tbody = document.getElementById('stepTableBody');
        const row = document.createElement('tr');
        const actionCell = document.createElement('td');
        const actionSelect = document.createElement('select');
        ['Click', 'Type', 'Select', 'Wait', 'Verify'].forEach(action => {
            const option = document.createElement('option');
            option.value = action;
            option.textContent = action;
            if (action === step.action) option.selected = true;
            actionSelect.appendChild(option);
        });
        actionCell.appendChild(actionSelect);
        const targetCell = document.createElement('td');
        const targetInput = document.createElement('input');
        targetInput.type = 'text';
        targetInput.value = step.target;
        targetInput.placeholder = 'Enter selector';
        targetCell.appendChild(targetInput);
        const valueCell = document.createElement('td');
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.value = step.value;
        valueInput.placeholder = 'Enter value';
        valueCell.appendChild(valueInput);

        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => row.remove();
        actionsCell.appendChild(deleteBtn);

        row.appendChild(actionCell);
        row.appendChild(targetCell);
        row.appendChild(valueCell);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    }

    function saveTest() {
        const steps = [];
        const rows = document.getElementById('stepTableBody').getElementsByTagName('tr');

        for (let row of rows) {
            const cells = row.getElementsByTagName('td');
            steps.push({
                action: cells[0].querySelector('select').value,
                target: cells[1].querySelector('input').value,
                value: cells[2].querySelector('input').value
            });
        }

        fetch('/create_test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ steps: steps })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Test case saved successfully!');
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function runTest() {
        const steps = [];
        const rows = document.getElementById('stepTableBody').getElementsByTagName('tr');

        for (let row of rows) {
            const cells = row.getElementsByTagName('td');
            steps.push({
                action: cells[0].querySelector('select').value,
                target: cells[1].querySelector('input').value,
                value: cells[2].querySelector('input').value
            });
        }

        fetch('/run_test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ steps: steps })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Test executed successfully!');
            }
        })
        .catch(error => console.error('Error:', error));
    }

    addStepToTable({
        action: 'Click',
        target: '#login-button',
        value: ''
    });
});
