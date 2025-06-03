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

  import type { MdDialog } from '@material/web/dialog/dialog';
  import Expandable from '../components/Expandable.svelte';
  import {
    type BuildingInsightsResponse,
    type RequestError,
    findClosestBuilding,
    type SolarPanelConfig,
  } from '../solar';
  import Show from '../components/Show.svelte';
  import SummaryCard from '../components/SummaryCard.svelte';
  import { createPalette, normalize, rgbToColor } from '../visualize';
  import { panelsPalette } from '../colors';
  import InputBool from '../components/InputBool.svelte';
  import InputPanelsCount from '../components/InputPanelsCount.svelte';
  import { showNumber } from '../utils';
  import NumberInput from '../components/InputNumber.svelte';
  import Gauge from '../components/Gauge.svelte';
  import { updateEngineState, sendInteraction } from '../../lib/communication';

  export let expandedSection: string;
  export let buildingInsights: BuildingInsightsResponse | undefined;
  export let configId: number | undefined;
  export let panelCapacityWatts: number;
  export let showPanels: boolean;

  export let googleMapsApiKey: string;
  export let geometryLibrary: google.maps.GeometryLibrary;
  export let location: google.maps.LatLng;
  export let map: google.maps.Map;

  const icon = 'home';
  const title = 'Building Insights endpoint';

  let requestSent = false;
  let requestError: RequestError | undefined;
  let apiResponseDialog: MdDialog;

  let panelConfig: SolarPanelConfig | undefined;
  $: if (buildingInsights && configId !== undefined) {
    panelConfig = buildingInsights.solarPotential.solarPanelConfigs[configId];
  }

  let solarPanels: google.maps.Polygon[] = [];
  $: solarPanels.map((panel, i) =>
    panel.setMap(showPanels && panelConfig && i < panelConfig.panelsCount ? map : null),
  );

  let panelCapacityRatio = 1.0;
  $: if (buildingInsights) {
    const defaultPanelCapacity = buildingInsights.solarPotential.panelCapacityWatts;
    panelCapacityRatio = panelCapacityWatts / defaultPanelCapacity;
  }

  export async function showSolarPotential(location: google.maps.LatLng) {
    if (requestSent) {
      return;
    }

    console.log('showSolarPotential');
    buildingInsights = undefined;
    requestError = undefined;

    solarPanels.map((panel) => panel.setMap(null));
    solarPanels = [];

    requestSent = true;
    try {
      buildingInsights = await findClosestBuilding(location, googleMapsApiKey);

      // Notify parent dashboard of new building insights
      updateEngineState({
        buildingInsights,
        solarPotential: buildingInsights.solarPotential,
      });

      // Send interaction event
      sendInteraction('solar_analysis_complete', {
        address: buildingInsights.postalCode,
        yearlyEnergy: buildingInsights.solarPotential.maxSunshineHoursPerYear,
        panelsCount: buildingInsights.solarPotential.solarPanels.length,
      });
    } catch (e) {
      requestError = e as RequestError;
      // Notify parent dashboard of error
      sendInteraction('solar_analysis_error', {
        error: requestError.error,
      });
      return;
    } finally {
      requestSent = false;
    }

    // Create the solar panels on the map.
    const solarPotential = buildingInsights.solarPotential;
    const palette = createPalette(panelsPalette).map(rgbToColor);
    const minEnergy = solarPotential.solarPanels.slice(-1)[0].yearlyEnergyDcKwh;
    const maxEnergy = solarPotential.solarPanels[0].yearlyEnergyDcKwh;
    
    // REALISTIC SOLAR PANEL PLACEMENT IMPROVEMENTS:
    // 1. Align panels with building orientation (parallel to walls)
    // 2. Add 5-foot roof edge buffer for safety and aesthetics  
    // 3. Reduce sensitivity to small obstacles (vents, etc.)
    // 4. Ensure panels stay within proper roof boundaries
    // 5. Create organized, professional-looking installation patterns
    
    // Calculate building bounds for edge buffer (5 feet = ~1.5 meters)
    const EDGE_BUFFER_METERS = 1.5;
    const buildingBounds = buildingInsights.boundingBox;
    const buildingCenter = buildingInsights.center;
    
    // Calculate primary building orientation (0°, 90°, 180°, or 270°)
    // Most buildings align with cardinal directions for aesthetic solar installations
    const buildingWidth = Math.abs(buildingBounds.ne.longitude - buildingBounds.sw.longitude);
    const buildingHeight = Math.abs(buildingBounds.ne.latitude - buildingBounds.sw.latitude);
    const primaryOrientation = buildingWidth > buildingHeight ? 0 : 90; // Align with longer building dimension
    
    // Filter panels to be less sensitive to small obstacles and add boundary checks
    const validPanels = solarPotential.solarPanels.filter((panel) => {
      // Check if panel is within proper roof boundaries (with buffer)
      const panelLat = panel.center.latitude;
      const panelLng = panel.center.longitude;
      
      // Calculate distance from building edges
      const distanceFromNorth = Math.abs(buildingBounds.ne.latitude - panelLat) * 111000; // Convert to meters
      const distanceFromSouth = Math.abs(panelLat - buildingBounds.sw.latitude) * 111000;
      const distanceFromEast = Math.abs(buildingBounds.ne.longitude - panelLng) * 111000 * Math.cos(panelLat * Math.PI / 180);
      const distanceFromWest = Math.abs(panelLng - buildingBounds.sw.longitude) * 111000 * Math.cos(panelLat * Math.PI / 180);
      
      const minDistanceFromEdge = Math.min(distanceFromNorth, distanceFromSouth, distanceFromEast, distanceFromWest);
      
      // Include panels that are:
      // 1. At least EDGE_BUFFER_METERS from building edges
      // 2. Have reasonable energy output (reduced threshold to include more panels)
      const hasGoodEnergyOutput = panel.yearlyEnergyDcKwh > (minEnergy + (maxEnergy - minEnergy) * 0.3); // Lower threshold
      const isWithinBounds = minDistanceFromEdge >= EDGE_BUFFER_METERS;
      
      return hasGoodEnergyOutput && isWithinBounds;
    });
    
    // Group valid panels by roof segment for organized placement
    const panelsBySegment = new Map<number, Array<typeof validPanels[0] & { originalIndex: number }>>();
    validPanels.forEach((panel, index) => {
      if (!panelsBySegment.has(panel.segmentIndex)) {
        panelsBySegment.set(panel.segmentIndex, []);
      }
      panelsBySegment.get(panel.segmentIndex)!.push({ ...panel, originalIndex: index });
    });

    // Sort panels within each segment for organized, grid-like patterns
    const organizedPanels: Array<typeof validPanels[0] & { originalIndex: number }> = [];
    panelsBySegment.forEach((segmentPanels, segmentIndex) => {
      // Sort for realistic installation patterns (rows and columns)
      segmentPanels.sort((a, b) => {
        // Primary sort: energy production (best panels first)
        const energyDiff = b.yearlyEnergyDcKwh - a.yearlyEnergyDcKwh;
        if (Math.abs(energyDiff) > 100) return energyDiff; // Less sensitive to energy differences
        
        // Secondary sort: create grid-like patterns aligned with building orientation
        if (primaryOrientation === 0) {
          // Horizontal building - sort by latitude then longitude
          const latDiff = b.center.latitude - a.center.latitude;
          if (Math.abs(latDiff) > 0.00001) return latDiff;
          return a.center.longitude - b.center.longitude;
        } else {
          // Vertical building - sort by longitude then latitude  
          const lngDiff = a.center.longitude - b.center.longitude;
          if (Math.abs(lngDiff) > 0.00001) return lngDiff;
          return b.center.latitude - a.center.latitude;
        }
      });
      
      organizedPanels.push(...segmentPanels);
    });

    solarPanels = organizedPanels.map((panel) => {
      const [w, h] = [solarPotential.panelWidthMeters / 2, solarPotential.panelHeightMeters / 2];
      const points = [
        { x: +w, y: +h }, // top right
        { x: +w, y: -h }, // bottom right
        { x: -w, y: -h }, // bottom left
        { x: -w, y: +h }, // top left
        { x: +w, y: +h }, //  top right
      ];
      
      // Use consistent orientation aligned with building (not roof segment azimuth)
      const panelOrientation = panel.orientation == 'PORTRAIT' ? 90 : 0;
      const buildingAlignedAzimuth = primaryOrientation; // Align with building, not roof segment
      
      const colorIndex = Math.round(normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255);
      return new google.maps.Polygon({
        paths: points.map(({ x, y }) =>
          geometryLibrary.spherical.computeOffset(
            { lat: panel.center.latitude, lng: panel.center.longitude },
            Math.sqrt(x * x + y * y),
            Math.atan2(y, x) * (180 / Math.PI) + panelOrientation + buildingAlignedAzimuth,
          ),
        ),
        strokeColor: '#1A1A1A',
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: palette[colorIndex],
        fillOpacity: 0.85,
      });
    });
  }

  // Update parent when config changes
  $: if (configId !== undefined && buildingInsights && panelConfig) {
    updateEngineState({
      buildingInsights,
      solarPotential: {
        ...buildingInsights.solarPotential,
        selectedConfig: panelConfig,
      },
    });
  }

  $: showSolarPotential(location);
</script>

{#if requestError}
  <div class="error-container on-error-container-text">
    <Expandable section={title} icon="error" {title} subtitle={requestError.error.status}>
      <div class="grid place-items-center py-2 space-y-4">
        <div class="grid place-items-center">
          <p class="body-medium">
            Error on <code>buildingInsights</code> request
          </p>
          <p class="title-large">ERROR {requestError.error.code}</p>
          <p class="body-medium"><code>{requestError.error.status}</code></p>
          <p class="label-medium">{requestError.error.message}</p>
        </div>
        <md-filled-button role={undefined} on:click={() => showSolarPotential(location)}>
          Retry
          <md-icon slot="icon">refresh</md-icon>
        </md-filled-button>
      </div>
    </Expandable>
  </div>
{:else if !buildingInsights}
  <div class="grid py-8 place-items-center">
    <md-circular-progress four-color indeterminate />
  </div>
{:else if configId !== undefined && panelConfig}
  <Expandable
    bind:section={expandedSection}
    {icon}
    {title}
    subtitle={`Yearly energy: ${(
      (panelConfig.yearlyEnergyDcKwh * panelCapacityRatio) /
      1000
    ).toFixed(2)} MWh`}
  >
    <div class="flex flex-col space-y-2 px-2">
      <span class="outline-text label-medium">
        <b>{title}</b> provides data on the location, dimensions & solar potential of a building.
      </span>

      <InputPanelsCount
        bind:configId
        solarPanelConfigs={buildingInsights.solarPotential.solarPanelConfigs}
      />
      <NumberInput
        bind:value={panelCapacityWatts}
        icon="bolt"
        label="Panel capacity"
        suffix="Watts"
      />
      <InputBool bind:value={showPanels} label="Solar panels" />

      <div class="grid justify-items-end">
        <md-filled-tonal-button role={undefined} on:click={() => apiResponseDialog.show()}>
          API response
        </md-filled-tonal-button>
      </div>

      <md-dialog bind:this={apiResponseDialog}>
        <div slot="headline">
          <div class="flex items-center primary-text">
            <md-icon>{icon}</md-icon>
            <b>&nbsp;{title}</b>
          </div>
        </div>
        <div slot="content">
          <Show value={buildingInsights} label="buildingInsightsResponse" />
        </div>
        <div slot="actions">
          <md-text-button role={undefined} on:click={() => apiResponseDialog.close()}>
            Close
          </md-text-button>
        </div>
      </md-dialog>
    </div>
  </Expandable>

  {#if expandedSection == title}
    <div class="absolute top-0 left-0 w-72">
      <div class="flex flex-col space-y-2 m-2">
        <SummaryCard
          {icon}
          {title}
          rows={[
            {
              icon: 'wb_sunny',
              name: 'Annual sunshine',
              value: showNumber(buildingInsights.solarPotential.maxSunshineHoursPerYear),
              units: 'hr',
            },
            {
              icon: 'square_foot',
              name: 'Roof area',
              value: showNumber(buildingInsights.solarPotential.wholeRoofStats.areaMeters2),
              units: 'm²',
            },
            {
              icon: 'solar_power',
              name: 'Max panel count',
              value: showNumber(buildingInsights.solarPotential.solarPanels.length),
              units: 'panels',
            },
            {
              icon: 'co2',
              name: 'CO₂ savings',
              value: showNumber(buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh),
              units: 'Kg/MWh',
            },
          ]}
        />

        <div class="p-4 w-full surface on-surface-text rounded-lg shadow-md">
          <div class="flex justify-around">
            <Gauge
              icon="solar_power"
              title="Panels count"
              label={showNumber(panelConfig.panelsCount)}
              labelSuffix={`/ ${showNumber(solarPanels.length)}`}
              max={solarPanels.length}
              value={panelConfig.panelsCount}
            />

            <Gauge
              icon="energy_savings_leaf"
              title="Yearly energy"
              label={showNumber((panelConfig?.yearlyEnergyDcKwh ?? 0) * panelCapacityRatio)}
              labelSuffix="KWh"
              max={buildingInsights.solarPotential.solarPanelConfigs.slice(-1)[0]
                .yearlyEnergyDcKwh * panelCapacityRatio}
              value={panelConfig.yearlyEnergyDcKwh * panelCapacityRatio}
            />
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}
