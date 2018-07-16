// Everything starts here.
// We prompt for the user's location.
getLocate();

let query = '';
let filters = {};
let page = 0;
let coordinates = null;
let firstSearch = true;
let facets = {
  'food_type': [],
  'payment_options': [],
};

/**
 * Prompt the user for their location and if provided
 * tell Algolia about that. Otherwise trigger a blank search
 * so that we have some data to display.
 */
function getLocate()
{
  loading(true);

  navigator.geolocation.getCurrentPosition(positionCallback, function(error) {
      console.log('Location not permitted...');

      $('#locationError').show();

      setTimeout(function() {
        $('#locationError').hide();
      }, 4000);

      performSearch();
  });
}

/**
 * Once we get the position we need to tell Algolia where
 * to center our searches
 */
function positionCallback(position)
{
  coordinates = `${position.coords.latitude}, ${position.coords.longitude}`;

  helper.aroundLatLng = coordinates;

  performSearch();
}

/**
 * Simple toggle for the "loading" elements.
 */
function loading(areWe = true)
{
  if (areWe) {
    $('.removeLoading').show();
  } else {
    $('.removeLoading').hide();
  }
}

/**
 * Render the UL element that holds all the possible cuisines
 */
function renderFoodTypes(cuisines)
{
  cuisines.sort(compare);

  $("#cuisines").empty();

  let useClass = '';

  for (i = 0; i < cuisines.length; i++) {
    let cleanName = cuisines[i].name.replace(/\W/g, '');

    if (facets['food_type'].indexOf(cleanName) > -1) {
      useClass = 'active';
    } else {
      useClass = '';
    }

    $("#cuisines").append('<li class="' + useClass + '" id="facet-food_type-' + cleanName + '" onClick="addFacet(\'food_type\', \'' + cuisines[i].name + '\');">' + cuisines[i].name + ' (' + cuisines[i].count + ')</li>');
  }
}

/**
 * For sorting an array alphabetically
 */
function compare(a, b) {
  if (a.name < b.name) {
    return -1;
  }

  if (a.name > b.name) {
    return 1;
  }

  return 0;
}

/**
 * Add a facet to the search
 */
function addFacet(facet, facetValue)
{
  helper.toggleFacetRefinement(facet, facetValue);

  let cleanName = facetValue.replace(/\W/g, '');

  if (facets[facet].indexOf(cleanName) > -1) {
    let facetIndex = facets[facet].indexOf(cleanName);
    facets[facet].splice(facetIndex, 1);
  } else {
    facets[facet].push(cleanName);
  }

  console.log('Existing Facets:', facets);

  $('#facet-' + facet + '-' + cleanName).toggleClass('active');

  page = 0;

  performSearch();
}

/**
 * Render Pagination
 * content.nbHits, content.nbPages, content.page
 */
function renderPagination(totalHits, totalPages, currentPage)
{
  let html = '<span id="paginationBlock">';
  let lastPage = 0;
  let nextPage = 0;
  let showLast = false;
  let showNext = true;

  if (currentPage > 0) {
    showLast = true;
    lastPage = currentPage - 1;
    html += '<a href="#" onClick="setPage(\'' + lastPage + '\')">&laquo; Back</a>';
  } else {
    html += '<span class="weak">&laquo; Back</span>';
  }

  if (currentPage == totalPages) {
    showNext = false;
    html += '<span class="weak">Next &raquo;</span>';
  } else {
    nextPage = currentPage + 1;
    html += '<a href="#" onClick="setPage(\'' + nextPage + '\')">Next &raquo;</a>';
  }

  html += '</span>';

  return html;
}

/**
 * Change the results page.
 */
function setPage(inputPage) {
  page = inputPage;

  performSearch();
}

/**
 * Render any hits
 */
function renderHits(content)
{
  if (content.hits.length === 0) {
    $('#container').html('<p class="weak">No results...</p>');
  } else {
    $('#container').html(function() {
      let showPage = content.page + 1;

      $('#hits_counter').html('Displaying ' + content.hits.length + ' of ' + content.nbHits + ' Results | Page ' + showPage + ' of ' + content.nbPages);
      $('#hits_pages').html(renderPagination(content.nbHits, content.nbPages, content.page));

      return $.map(content.hits, function(hit) {
        let html = '<div class="result">';
        html += '  <a href="' + hit.mobile_reserve_url + '" target="_blank"><img class="restaurant" src="' + hit.image_url + '" /></a>';
        html += '  <h2><a href="' + hit.mobile_reserve_url + '" target="_blank">' + hit.name + '</a></h2>';
        html += '<p>' + renderRating(hit.stars_count) + ' (' + hit.reviews_count + ' reviews)</p>';
        html += '  <p>' + hit.food_type + ' | ' + hit.area + ' | ' + hit.price_range + '</p>';
        html += '</div><div class="clear"></div>';

        return html;
      });
    });
  }
}

/**
 * Add a filter via the facet tools
 */
function addFilter(name, value)
{
  // Resets the current page to 0
  helper.toggleFacetRefinement(name, facetValue);

  console.log('Adding Facet:', name, facetValue);

  page = 0;

  performSearch();
}

function showFilters() {
  $('#filterDiv').toggle();
  $('#showFilters').toggleClass('on');
}

/**
 * Render the restaurant's rating.
 */
function renderRating(star_count)
{
  let rounded = Math.round(star_count);
  let totalFilled = 5 + rounded - 5;
  let totalEmpty = 5 - totalFilled;
  let display = '';

  while (totalFilled > 0) {
    display += '<img src="resources/graphics/stars-plain.png" class="starImg" />';

    totalFilled--;
  }

  while (totalEmpty > 0) {
    display += '<img src="resources/graphics/star-empty.png" class="starImg" />';

    totalEmpty--;
  }

  return '<span class="orange numericRating">' + star_count + '</span>' + display;
}

/**
 * Perform a search
 */
function performSearch()
{
  loading();

  helper.setQuery(query);

  if (coordinates) {
    helper.setQueryParameter('aroundLatLng', coordinates);
  }

  console.log('Settings page to ' + page);
  
  helper.setPage(page);

  helper.search().getPage();
}

/**
 * helper.nextPage()
 * helper.previousPage()
 */
function changePage(direction)
{
  if (direction == 'forward') {
    page += 1;
  } else {
    page -= 1;

    if (page < 1) {
      page = 1;
    }
  }

  performSearch();
}

/**
 * Watch the search box changes and trigger search
 */
$('#search-box').on('keyup', function()
{
  query = $(this).val();

  performSearch();
});

/**
 * Filter the cuisines list
 */
$('#cuisineSearch').on('keyup', function()
{
  // let filter = $(this).val().toUpperCase();
  // let ul = document.getElementById("cuisines");
  let li = document.getElementById("cuisines").getElementsByTagName('li');

  // Loop through the unordered list and hide
  // ones that don't match the search
  for (i = 0; i < li.length; i++) {
    if (li[i].innerHTML.toUpperCase().indexOf($(this).val().toUpperCase()) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
});


/**
 * Detect a search result being returned.
 */
helper.on('result', function(content)
{
  console.log(content);

  renderHits(content); 

  let foodTypes = content.getFacetValues('food_type');
  renderFoodTypes(foodTypes);
  console.log('Rendering food types', foodTypes);

  loading(false);
  
  firstSearch = false;
});
