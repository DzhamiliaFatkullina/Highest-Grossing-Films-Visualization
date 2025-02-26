document.addEventListener('DOMContentLoaded', function() {
    // 1. Load the JSON data
    fetch('output.json')
        .then(response => response.json())
        .then(data => {
            const movies = data; // Store the movie data

            // 2. Populate Filter Dropdowns
            populateDirectorFilter(movies);
            populateCountryFilter(movies);

            // 3. Event Listener for Filter Application
            document.getElementById('applyFilters').addEventListener('click', function() {
                const director = document.getElementById('directorFilter').value;
                const country = document.getElementById('countryFilter').value;
                const year = document.getElementById('yearFilter').value;
                const gross = document.getElementById('grossFilter').value;

                const filteredMovies = filterMovies(movies, director, country, year, gross);
                displayMovies(filteredMovies);
            });

            // 4. Display Initial Data (All movies initially)
            displayMovies(movies);

             // 5. Event Listener for Reset Filters
            document.getElementById('resetFilters').addEventListener('click', function() {
                document.getElementById('directorFilter').value = "";
                document.getElementById('countryFilter').value = "";
                document.getElementById('yearFilter').value = "";
                document.getElementById('grossFilter').value = "";
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


    function filterMovies(movies, director, country, year, gross) {
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
            if (year && year !== "" && movie.release_year !== parseInt(year)) {
                return false;
            }

            // Gross Filter
            if (gross && gross !== "" && movie.worldwide_gross < parseInt(gross)) {
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
});
