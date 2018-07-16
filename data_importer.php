<?php

/**
 * Normalizes and imports the restaurant dataset.
 *
 * @author 	Jon Belelieu
 * @date 	July 13th, 2018
 *
 * DESCRIPTION
 *   Primary data is help in the /resources/dataset/restaurants_list.json file with
 *   supplement data being held in the restaurants_info.csv file.
 *   This utility will merge them into a single dataset that can be imported into
 *   the Algolia system.
 *
 * USAGE
 *   1. From the command line, simply run "php data_importer.php"
 *   2. This will output a valid JSON file named final_data.json
 *   3. Upload final_dataset.json to Algolia.
 */

// Load the primary JSON-based data set and store
// this as an array to which we will add the
// supplemental data.
$primaryDataset = json_decode(file_get_contents(dirname(__FILE__) . '/resources/dataset/restaurants_list.json'), true);

// Place everything into an associative array with the
// ObjectID as the key.
$finalDataset = [];
foreach ($primaryDataset as $item) {
	$finalDataset[$item['objectID']] = $item;
}

// Now load the CSV file with the supplemental data.
// All we need is the food_type value, so we'll cherry
// pick that information from each line then move on.
$handle = fopen(dirname(__FILE__) . "/resources/dataset/restaurants_info.csv", "r");

$cuisinePosition = $reviewsPosition = $priceRangePosition = $ratingPosition = 0;
$row = 0;

while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
	$row++;

	// Top row is the column names.
	// We need to know the index for other columns that
	// we want to import, such as "reviews_count" and
	// "star_count", etc.
	if ($row == 1) {
	    $num = count($data);

		for ($i = 0; $i < $num; $i++) {
			if ($data[$i] == 'food_type') {
				$cuisinePosition = $i;
			} else if ($data[$i] == 'reviews_count') {
				$reviewsPosition = $i;
			} else if ($data[$i] == 'stars_count') {
				$ratingPosition = $i;
			} else if ($data[$i] == 'price_range') {
				$priceRangePosition = $i;
			}
		}
	}

	// All other rows are restaurants. We cherry pick
	// from these rows now. We set up the indicies above.
	else {
		$finalDataset[$data[0]]['food_type'] = $data[$cuisinePosition];
		$finalDataset[$data[0]]['stars_count'] = $data[$ratingPosition];
		$finalDataset[$data[0]]['reviews_count'] = $data[$reviewsPosition];
		$finalDataset[$data[0]]['price_range'] = $data[$priceRangePosition];
	}
}

fclose($handle);

// Finally, remove the array keys and write the file JSON
// to the "final_data.json" file. This is now ready for import.
$handle = fopen('final_data.json', 'w') or die('Cannot open file');
fwrite($handle, json_encode(array_values($finalDataset)));

echo "Done.";
exit;
