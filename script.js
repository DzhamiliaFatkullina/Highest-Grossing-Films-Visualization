document.addEventListener('DOMContentLoaded', function() {
    // 1. Load the JSON data
    fetch('output.json')
        .then(response => response.json())
        .then(data => {
            const movies = data; // Store the movie data

            // 2. Populate Filter Dropdowns
            populateDirectorFilter(movies);
            populateCountryFilter(movies);
            initializeTimeline(movies);
            initializeGrossTimeline(movies);

            // 3. Event Listener for Filter Application
            document.getElementById('applyFilters').addEventListener('click', function() {
                filterAndDisplayMovies(movies);
            });

            // 4. Display Initial Data (All movies initially)
            displayMovies(movies);

            // 5. Event Listener for Reset Filters
            document.getElementById('resetFilters').addEventListener('click', function() {
                document.getElementById('directorFilter').value = "";
                document.getElementById('countryFilter').value = "";
                displayMovies(movies); // Display all movies again
            });

        })
        .catch(error => console.error('Error loading JSON:', error));

    // --- Helper Functions ---

    function populateDirectorFilter(movies) {
        const directorFilter = document.getElementById('directorFilter');
        const directors = new Set(); // Use a Set to ensure unique values

        movies.forEach(movie => {
            movie.director.forEach(director => directors.add(director));
        });

        directors.forEach(director => {
            const option = document.createElement('option');
            option.value = director;
            option.textContent = director;
            directorFilter.appendChild(option);
        });
    }

    function populateCountryFilter(movies) {
        const countryFilter = document.getElementById('countryFilter');
        const countries = new Set();

        movies.forEach(movie => {
            movie.country.forEach(country => countries.add(country));
        });

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
        });
    }

    function filterMovies(movies, director, country, startYear, endYear, startGross, endGross) {
        return movies.filter(movie => {
            // Director Filter
            if (director && director !== "" && !movie.director.includes(director)) {
                return false;
            }

            // Country Filter
            if (country && country !== "" && !movie.country.includes(country)) {
                return false;
            }

            // Year Filter
            if (movie.release_year < startYear || movie.release_year > endYear) {
                return false;
            }

            // Gross Filter
            if (movie.worldwide_gross < startGross || movie.worldwide_gross > endGross) {
                return false;
            }

            return true; // Movie passes all filters
        });
    }

    function displayMovies(movies) {
        const tableBody = document.querySelector('#movie-table tbody');
        tableBody.innerHTML = ''; // Clear existing table rows

        movies.forEach(movie => {
            const row = document.createElement('tr');

            const titleCell = document.createElement('td');
            titleCell.textContent = movie.title;
            row.appendChild(titleCell);

            const grossCell = document.createElement('td');
            grossCell.textContent = movie.worldwide_gross.toLocaleString(); // Format with commas
            row.appendChild(grossCell);

            const yearCell = document.createElement('td');
            yearCell.textContent = movie.release_year;
            row.appendChild(yearCell);

            const directorCell = document.createElement('td');
            directorCell.textContent = movie.director.join(', '); // Handle multiple directors
            row.appendChild(directorCell);

            const countryCell = document.createElement('td');
            countryCell.textContent = movie.country.join(', ');  // Handle multiple countries
            row.appendChild(countryCell);

            tableBody.appendChild(row);
        });
    }

    function initializeTimeline(movies) {
        const startYearDot = document.getElementById('startYearDot');
        const endYearDot = document.getElementById('endYearDot');
        const yearTimeline = document.getElementById('yearTimeline');
        const startYearDisplay = document.getElementById('startYearDisplay');
        const endYearDisplay = document.getElementById('endYearDisplay');

        // Find the earliest and latest years in the dataset
        let minYear = Math.min(...movies.map(movie => movie.release_year));
        let maxYear = Math.max(...movies.map(movie => movie.release_year));

        // Set initial positions of the dots
        let startYear = minYear;
        let endYear = maxYear;

        // Display initial year range
        updateYearDisplay(startYear, endYear);

        // Set initial dot positions based on minYear and maxYear
        setDotPosition(startYearDot, startYear, minYear, maxYear, yearTimeline.offsetWidth);
        setDotPosition(endYearDot, endYear, minYear, maxYear, yearTimeline.offsetWidth);

        // Make the dots draggable
        makeDraggable(startYearDot, minYear, maxYear);
        makeDraggable(endYearDot, minYear, maxYear);

        // Function to calculate and set dot position
        function setDotPosition(dot, year, minYear, maxYear, timelineWidth) {
            const position = ((year - minYear) / (maxYear - minYear)) * timelineWidth;
            dot.style.left = `${position}px`;
        }

        // Function to update the year display
        function updateYearDisplay(startYear, endYear) {
            startYearDisplay.textContent = startYear;
            endYearDisplay.textContent = endYear;
        }

        function makeDraggable(dot, minYear, maxYear) {
            let isDragging = false;
            let startX;
            let startLeft;

            dot.addEventListener('mousedown', function(e) {
                isDragging = true;
                startX = e.clientX;
                startLeft = dot.offsetLeft;
                dot.style.cursor = 'grabbing'; // Change cursor on drag start
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                const timelineWidth = yearTimeline.offsetWidth;
                const maxX = timelineWidth;

                let newLeft = startLeft + (e.clientX - startX);

                //Keep dots within the limits of the timeline and each other
                if(dot.id === 'startYearDot'){
                    newLeft = Math.max(0, Math.min(newLeft, endYearDot.offsetLeft));
                } else {
                newLeft = Math.max(startYearDot.offsetLeft, Math.min(newLeft, maxX));
                }

                dot.style.left = `${newLeft}px`;

                // Calculate year based on the new position
                let newYear = Math.round(minYear + (newLeft / timelineWidth) * (maxYear - minYear));

                if (dot.id === 'startYearDot') {
                    startYear = newYear;
                } else {
                    endYear = newYear;
                }

                updateYearDisplay(startYear, endYear);

                //Update and filter movies whenever dot is dragged
                filterAndDisplayMovies(movies);
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
                dot.style.cursor = 'grab'; // Restore the cursor
            });

            document.addEventListener('mouseleave', function() {
                isDragging = false;
                dot.style.cursor = 'grab'; // Restore the cursor when mouse leaves the document
            });
        }

        function filterAndDisplayMovies(movies) {
            const director = document.getElementById('directorFilter').value;
            const country = document.getElementById('countryFilter').value;
            const startGross = parseFloat(document.getElementById('minGrossDisplay').textContent.replace(/,/g, ''));
            const endGross = parseFloat(document.getElementById('maxGrossDisplay').textContent.replace(/,/g, ''));

            const filteredMovies = filterMovies(movies, director, country, startYear, endYear, startGross, endGross);
            displayMovies(filteredMovies);
        }

        //Event listener to apply filters
        document.getElementById('applyFilters').addEventListener('click', function() {
            filterAndDisplayMovies(movies);
        });

        // Function to filter movies based on timeline values
        document.getElementById('yearTimeline').addEventListener('input', function() {
           filterAndDisplayMovies(movies);
        });
    }

    function initializeGrossTimeline(movies) {
        const minGrossDot = document.getElementById('minGrossDot');
        const maxGrossDot = document.getElementById('maxGrossDot');
        const grossTimeline = document.getElementById('grossTimeline');
        const minGrossDisplay = document.getElementById('minGrossDisplay');
        const maxGrossDisplay = document.getElementById('maxGrossDisplay');

        // Find the minimum and maximum gross values in the dataset
        let minGross = Math.min(...movies.map(movie => movie.worldwide_gross));
        let maxGross = Math.max(...movies.map(movie => movie.worldwide_gross));

        // Set initial positions of the dots
        let startGross = minGross;
        let endGross = maxGross;

        // Display initial gross range
        updateGrossDisplay(startGross, endGross);

        // Set initial dot positions based on minGross and maxGross
        setDotPosition(minGrossDot, startGross, minGross, maxGross, grossTimeline.offsetWidth);
        setDotPosition(maxGrossDot, endGross, minGross, maxGross, grossTimeline.offsetWidth);

        // Function to calculate and set dot position
        function setDotPosition(dot, gross, minGross, maxGross, timelineWidth) {
            const position = ((gross - minGross) / (maxGross - minGross)) * timelineWidth;
            dot.style.left = `${position}px`;
        }

        // Function to update the gross display
        function updateGrossDisplay(startGross, endGross) {
            minGrossDisplay.textContent = startGross.toLocaleString();
            maxGrossDisplay.textContent = endGross.toLocaleString();
        }

        function makeDraggable(dot, minGross, maxGross) {
            let isDragging = false;
            let startX;
            let startLeft;

            dot.addEventListener('mousedown', function(e) {
                isDragging = true;
                startX = e.clientX;
                startLeft = dot.offsetLeft;
                dot.style.cursor = 'grabbing'; // Change cursor on drag start
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                const timelineWidth = grossTimeline.offsetWidth;
                const maxX = timelineWidth;

                let newLeft = startLeft + (e.clientX - startX);

                //Keep dots within the limits of the timeline and each other
                if(dot.id === 'minGrossDot'){
                    newLeft = Math.max(0, Math.min(newLeft, maxGrossDot.offsetLeft));
                } else {
                newLeft = Math.max(minGrossDot.offsetLeft, Math.min(newLeft, maxX));
                }
                dot.style.left = `${newLeft}px`;

                // Calculate gross based on the new position
                let newGross = Math.round(minGross + (newLeft / timelineWidth) * (maxGross - minGross));

                if (dot.id === 'minGrossDot') {
                    startGross = newGross;
                } else {
                    endGross = newGross;
                }

                updateGrossDisplay(startGross, endGross);

                //Update and filter movies whenever dot is dragged
                filterAndDisplayMovies(movies);
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
                dot.style.cursor = 'grab'; // Restore the cursor
            });

            document.addEventListener('mouseleave', function() {
                isDragging = false;
                dot.style.cursor = 'grab'; // Restore the cursor when mouse leaves the document
            });
        }

        // Make dots draggable after fetching minimum and maximum gross value from JSON
        makeDraggable(minGrossDot, minGross, maxGross);
        makeDraggable(maxGrossDot, minGross, maxGross);

        function filterAndDisplayMovies(movies) {
            const director = document.getElementById('directorFilter').value;
            const country = document.getElementById('countryFilter').value;
            const startYear = parseInt(document.getElementById('startYearDisplay').textContent);
            const endYear = parseInt(document.getElementById('endYearDisplay').textContent);

            const filteredMovies = filterMovies(movies, director, country, startYear, endYear, startGross, endGross);
            displayMovies(filteredMovies);
        }

        //Event listener to apply filters
        document.getElementById('applyFilters').addEventListener('click', function() {
            filterAndDisplayMovies(movies);
        });

        // Function to filter movies based on timeline values
        document.getElementById('yearTimeline').addEventListener('input', function() {
           filterAndDisplayMovies(movies);
        });
    }
});