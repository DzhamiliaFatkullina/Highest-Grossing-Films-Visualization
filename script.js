document.addEventListener('DOMContentLoaded', function () {
    let movies = []; // Store movie data globally
    let sortState = { column: null, order: null }; // Track sorting state

    // Load JSON data
    fetch('output.json')
        .then(response => response.json())
        .then(data => {
            movies = data;
            initializeApp(movies);
        })
        .catch(error => console.error('Error loading JSON:', error));

    function initializeApp(movies) {
        populateDropdowns(movies);
        initializeTimelines(movies);
        setupEventListeners(movies);
        displayMovies(movies); // Display all movies initially
    }

    // Populate director and country dropdowns
    function populateDropdowns(movies) {
        populateFilter('directorFilter', getUniqueValues(movies, 'director'));
        populateFilter('countryFilter', getUniqueValues(movies, 'country'));
    }

    // Generic function to populate a dropdown filter
    function populateFilter(filterId, values) {
        const filter = document.getElementById(filterId);
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filter.appendChild(option);
        });
    }

    // Get unique values from a nested array property (e.g., director, country)
    function getUniqueValues(movies, property) {
        const values = new Set();
        movies.forEach(movie => movie[property].forEach(value => values.add(value)));
        return Array.from(values);
    }

    // Initialize year and gross timelines
    function initializeTimelines(movies) {
        initializeTimeline('yearTimeline', 'startYearDot', 'endYearDot', 'startYearDisplay', 'endYearDisplay', movies, 'release_year');
        initializeTimeline('grossTimeline', 'minGrossDot', 'maxGrossDot', 'minGrossDisplay', 'maxGrossDisplay', movies, 'worldwide_gross');
    }

    // Generic function to initialize a timeline
    function initializeTimeline(timelineId, startDotId, endDotId, startDisplayId, endDisplayId, movies, property) {
        const timeline = document.getElementById(timelineId);
        const startDot = document.getElementById(startDotId);
        const endDot = document.getElementById(endDotId);
        const startDisplay = document.getElementById(startDisplayId);
        const endDisplay = document.getElementById(endDisplayId);

        const minValue = Math.min(...movies.map(movie => movie[property]));
        const maxValue = Math.max(...movies.map(movie => movie[property]));

        let startValue = minValue;
        let endValue = maxValue;

        updateDisplay(startDisplay, startValue, property);
        updateDisplay(endDisplay, endValue, property);

        setDotPosition(startDot, startValue, minValue, maxValue, timeline.offsetWidth);
        setDotPosition(endDot, endValue, minValue, maxValue, timeline.offsetWidth);

        makeDraggable(startDot, minValue, maxValue, timeline, startDisplay, endDisplay, property);
        makeDraggable(endDot, minValue, maxValue, timeline, startDisplay, endDisplay, property);
    }

    // Update display values (year or gross)
    function updateDisplay(displayElement, value, property) {
        displayElement.textContent = property === 'release_year' ? value : value.toLocaleString();
    }

    // Set dot position on the timeline
    function setDotPosition(dot, value, minValue, maxValue, timelineWidth) {
        const position = ((value - minValue) / (maxValue - minValue)) * timelineWidth;
        dot.style.left = `${position}px`;
    }

    // Make dots draggable
    function makeDraggable(dot, minValue, maxValue, timeline, startDisplay, endDisplay, property) {
        let isDragging = false;
        let startX, startLeft;

        dot.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startLeft = dot.offsetLeft;
            dot.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const timelineWidth = timeline.offsetWidth;
            let newLeft = startLeft + (e.clientX - startX);

            if (dot.id.includes('start') || dot.id.includes('min')) {
                newLeft = Math.max(0, Math.min(newLeft, document.getElementById(dot.id.replace('start', 'end').replace('min', 'max')).offsetLeft));
            } else {
                newLeft = Math.max(document.getElementById(dot.id.replace('end', 'start').replace('max', 'min')).offsetLeft, Math.min(newLeft, timelineWidth));
            }

            dot.style.left = `${newLeft}px`;

            const newValue = Math.round(minValue + (newLeft / timelineWidth) * (maxValue - minValue));

            if (dot.id.includes('start') || dot.id.includes('min')) {
                startDisplay.textContent = property === 'release_year' ? newValue : newValue.toLocaleString();
            } else {
                endDisplay.textContent = property === 'release_year' ? newValue : newValue.toLocaleString();
            }

            filterAndDisplayMovies(movies);
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            dot.style.cursor = 'grab';
        });

        document.addEventListener('mouseleave', () => {
            isDragging = false;
            dot.style.cursor = 'grab';
        });
    }

    // Filter movies based on selected criteria
    function filterMovies(movies, director, country, startYear, endYear, startGross, endGross) {
        return movies.filter(movie =>
            (!director || movie.director.includes(director)) &&
            (!country || movie.country.includes(country)) &&
            (movie.release_year >= startYear && movie.release_year <= endYear) &&
            (movie.worldwide_gross >= startGross && movie.worldwide_gross <= endGross)
        );
    }

    // Display filtered movies
    function displayMovies(movies) {
        const tableBody = document.querySelector('#movie-table tbody');
        tableBody.innerHTML = '';

        movies.forEach(movie => {
            const row = document.createElement('tr');
            ['title', 'worldwide_gross', 'release_year', 'director', 'country'].forEach(prop => {
                const cell = document.createElement('td');
                cell.textContent = Array.isArray(movie[prop]) ? movie[prop].join(', ') : (prop === 'worldwide_gross' ? movie[prop].toLocaleString() : movie[prop]);
                row.appendChild(cell);
            });
            tableBody.appendChild(row);
        });
    }

    // Sort movies by a specific column
    function sortMovies(movies, column, order) {
        return movies.sort((a, b) => {
            if (order === 'asc') {
                return a[column] > b[column] ? 1 : -1;
            } else {
                return a[column] < b[column] ? 1 : -1;
            }
        });
    }

    // Apply filters and display movies
    function filterAndDisplayMovies(movies) {
        const director = document.getElementById('directorFilter').value;
        const country = document.getElementById('countryFilter').value;
        const startYear = parseInt(document.getElementById('startYearDisplay').textContent);
        const endYear = parseInt(document.getElementById('endYearDisplay').textContent);
        const startGross = parseFloat(document.getElementById('minGrossDisplay').textContent.replace(/,/g, ''));
        const endGross = parseFloat(document.getElementById('maxGrossDisplay').textContent.replace(/,/g, ''));

        let filteredMovies = filterMovies(movies, director, country, startYear, endYear, startGross, endGross);

        // Apply sorting if a column is selected
        if (sortState.column) {
            filteredMovies = sortMovies(filteredMovies, sortState.column, sortState.order);
        }

        displayMovies(filteredMovies);
    }

    // Setup event listeners
    function setupEventListeners(movies) {
        document.getElementById('applyFilters').addEventListener('click', () => filterAndDisplayMovies(movies));
        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('directorFilter').value = '';
            document.getElementById('countryFilter').value = '';
            filterAndDisplayMovies(movies);
        });

        // Add sorting event listeners for buttons
        document.getElementById('sortGrossAsc').addEventListener('click', () => {
            sortState.column = 'worldwide_gross';
            sortState.order = 'asc';
            updateSortButtons('sortGrossAsc');
            filterAndDisplayMovies(movies);
        });

        document.getElementById('sortGrossDesc').addEventListener('click', () => {
            sortState.column = 'worldwide_gross';
            sortState.order = 'desc';
            updateSortButtons('sortGrossDesc');
            filterAndDisplayMovies(movies);
        });

        document.getElementById('sortYearAsc').addEventListener('click', () => {
            sortState.column = 'release_year';
            sortState.order = 'asc';
            updateSortButtons('sortYearAsc');
            filterAndDisplayMovies(movies);
        });

        document.getElementById('sortYearDesc').addEventListener('click', () => {
            sortState.column = 'release_year';
            sortState.order = 'desc';
            updateSortButtons('sortYearDesc');
            filterAndDisplayMovies(movies);
        });
    }

    // Update active sort button styles
    function updateSortButtons(activeButtonId) {
        // Remove active class from all sort buttons
        document.querySelectorAll('.sort-btn').forEach(button => button.classList.remove('active'));

        // Add active class to the clicked button
        document.getElementById(activeButtonId).classList.add('active');
    }
});