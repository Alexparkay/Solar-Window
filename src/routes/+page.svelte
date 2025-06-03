<!--
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 -->

<script lang="ts">
  /* global google */

  import * as GMAPILoader from '@googlemaps/js-api-loader';
  const { Loader } = GMAPILoader;

  import { onMount } from 'svelte';

  import SearchBar from './components/SearchBar.svelte';
  import Sections from './sections/Sections.svelte';
  import { initCommunication, updateEngineState, sendInteraction } from '../lib/communication';

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const defaultPlace = {
    name: '303 S Technology Ct',
    address: '303 S Technology Ct',
  };
  let location: google.maps.LatLng | undefined;
  const zoom = 19;

  // Initialize app.
  let mapElement: HTMLElement;
  let map: google.maps.Map;
  let geometryLibrary: google.maps.GeometryLibrary;
  let mapsLibrary: google.maps.MapsLibrary;
  let placesLibrary: google.maps.PlacesLibrary;
  onMount(async () => {
    // Initialize communication with parent dashboard
    initCommunication();

    // Load the Google Maps libraries.
    const loader = new Loader({ apiKey: googleMapsApiKey });
    const libraries = {
      geometry: loader.importLibrary('geometry'),
      maps: loader.importLibrary('maps'),
      places: loader.importLibrary('places'),
    };
    geometryLibrary = await libraries.geometry;
    mapsLibrary = await libraries.maps;
    placesLibrary = await libraries.places;

    // Get the address information for the default location.
    const geocoder = new google.maps.Geocoder();
    const geocoderResponse = await geocoder.geocode({
      address: defaultPlace.address,
    });
    const geocoderResult = geocoderResponse.results[0];

    // Initialize the map at the desired location.
    location = geocoderResult.geometry.location;
    map = new mapsLibrary.Map(mapElement, {
      center: location,
      zoom: zoom,
      tilt: 0,
      mapTypeId: 'satellite',
      mapTypeControl: false,
      fullscreenControl: false,
      rotateControl: false,
      streetViewControl: false,
      zoomControl: false,
    });

    // Add click event listener to the map
    map.addListener('click', async (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        location = event.latLng;
        // Get the address for the clicked location
        const geocoderResponse = await geocoder.geocode({
          location: event.latLng,
        });
        if (geocoderResponse.results[0]) {
          defaultPlace.name = geocoderResponse.results[0].formatted_address;
          defaultPlace.address = geocoderResponse.results[0].formatted_address;

          // Send interaction to parent
          sendInteraction('map_click', {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            address: geocoderResponse.results[0].formatted_address,
          });

          // Update state
          updateEngineState({
            location: { lat: event.latLng.lat(), lng: event.latLng.lng() },
            address: geocoderResponse.results[0].formatted_address,
          });
        }
      }
    });
  });

  // Watch for location changes to update state
  $: if (location) {
    updateEngineState(
      {
        location: { lat: location.lat(), lng: location.lng() },
      },
      false,
    ); // Don't notify right away, wait for more complete data
  }
</script>

<!-- Top bar -->
<div class="flex flex-row h-full">
  <!-- Main map -->
  <div bind:this={mapElement} class="w-full" />

  {#if placesLibrary && map}
    <SearchBar bind:location {placesLibrary} {map} initialValue={defaultPlace.name} />
  {/if}

  <!-- Side bar -->
  <aside class="flex-none md:w-96 w-80 p-2 pt-3 overflow-auto">
    <div class="flex flex-col space-y-2 h-full">
      {#if location}
        <Sections {location} {map} {geometryLibrary} {googleMapsApiKey} />
      {/if}

      <div class="grow" />
    </div>
  </aside>
</div>
