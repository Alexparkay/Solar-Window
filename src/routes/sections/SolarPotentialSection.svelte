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

  import { slide } from 'svelte/transition';

  import Expandable from '../components/Expandable.svelte';
  import SummaryCard from '../components/SummaryCard.svelte';
  import type { SolarPanelConfig } from '../solar';
  import Table from '../components/Table.svelte';

  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  import { GoogleCharts } from 'google-charts';
  import { findSolarConfig, showMoney, showNumber } from '../utils';
  import InputNumber from '../components/InputNumber.svelte';
  import InputPanelsCount from '../components/InputPanelsCount.svelte';
  import InputMoney from '../components/InputMoney.svelte';
  import InputPercent from '../components/InputPercent.svelte';
  import InputRatio from '../components/InputRatio.svelte';
  import { getRegionalEnergyData, type RegionalEnergyData } from '../eia-api';
  import EnergyCostCard from '../components/EnergyCostCard.svelte';

  export let expandedSection: string;
  export let configId: number;
  export let monthlyAverageEnergyBillInput: number;
  export let energyCostPerKwhInput: number;
  export let panelCapacityWattsInput: number;
  export let dcToAcDerateInput: number;
  export let solarPanelConfigs: SolarPanelConfig[];
  export let defaultPanelCapacityWatts: number;
  export let location: google.maps.LatLng;

  const icon = 'payments';
  const title = 'Solar Potential analysis';

  let costChart: HTMLElement;
  let showAdvancedSettings = false;

  // Regional energy data from EIA API
  let regionalEnergyData: RegionalEnergyData | null = null;
  let isLoadingEnergyData = true;
  let energyDataError = false;
  let energyDataErrorMessage = '';

  // Load regional energy data when location changes
  $: if (location) {
    loadRegionalEnergyData(location);
  }

  async function loadRegionalEnergyData(location: google.maps.LatLng) {
    isLoadingEnergyData = true;
    energyDataError = false;
    energyDataErrorMessage = '';

    try {
      console.log('Loading energy data for location:', location.toString());
      regionalEnergyData = await getRegionalEnergyData(location);
      console.log('Received regional energy data:', regionalEnergyData);

      // If we got valid energy data, update the energy cost input with the regional average
      if (regionalEnergyData?.averageResidentialRate) {
        // EIA API returns in cents per kWh, so divide by 100 to get dollars per kWh
        const regionRate = regionalEnergyData.averageResidentialRate / 100;
        console.log('Regional rate:', regionRate, 'Current rate:', energyCostPerKwhInput);

        // Only auto-update if user hasn't manually set a value that's significantly different
        if (Math.abs(energyCostPerKwhInput - regionRate) > 0.05) {
          console.log('Updating energy cost to regional rate:', regionRate);
          energyCostPerKwhInput = regionRate;
          updateConfig();
        }
      } else {
        console.warn('No valid residential rate found in energy data');
      }
    } catch (error) {
      console.error('Error loading regional energy data:', error);
      energyDataError = true;
      energyDataErrorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Don't hide the error state immediately
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } finally {
      isLoadingEnergyData = false;
    }
  }

  // [START solar_potential_calculations]
  // Solar configuration, from buildingInsights.solarPotential.solarPanelConfigs
  let panelsCount = 20;
  let yearlyEnergyDcKwh = 12000;

  // Basic settings
  let monthlyAverageEnergyBill: number = 300;
  let energyCostPerKwh = 0.31;
  let panelCapacityWatts = 450; // Updated to Q-Solar Elite wattage
  let solarIncentives: number = 7000;
  let installationCostPerWatt: number = 4.0;
  let installationLifeSpan: number = 30; // Updated to Q-Solar Elite warranty period

  // Advanced settings
  let dcToAcDerate = 0.982; // Updated to Q-Power X2 efficiency
  let efficiencyDepreciationFactor = 0.995;
  let costIncreaseFactor = 1.022;
  let discountRate = 1.04;

  // Solar installation
  let installationSizeKw: number = (panelsCount * panelCapacityWatts) / 1000;
  let installationCostTotal: number = installationCostPerWatt * installationSizeKw * 1000;

  // Energy consumption
  let monthlyKwhEnergyConsumption: number = monthlyAverageEnergyBill / energyCostPerKwh;
  let yearlyKwhEnergyConsumption: number = monthlyKwhEnergyConsumption * 12;

  // Energy produced for installation life span
  let initialAcKwhPerYear: number = yearlyEnergyDcKwh * dcToAcDerate;
  let yearlyProductionAcKwh: number[] = [...Array(installationLifeSpan).keys()].map(
    (year) => initialAcKwhPerYear * efficiencyDepreciationFactor ** year,
  );

  // Cost with solar for installation life span
  let yearlyUtilityBillEstimates: number[] = yearlyProductionAcKwh.map(
    (yearlyKwhEnergyProduced, year) => {
      const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
      const billEstimate =
        (billEnergyKwh * energyCostPerKwh * costIncreaseFactor ** year) / discountRate ** year;
      return Math.max(billEstimate, 0); // bill cannot be negative
    },
  );
  let remainingLifetimeUtilityBill: number = yearlyUtilityBillEstimates.reduce((x, y) => x + y, 0);
  let totalCostWithSolar: number =
    installationCostTotal + remainingLifetimeUtilityBill - solarIncentives;
  console.log(`Cost with solar: $${totalCostWithSolar.toFixed(2)}`);

  // Cost without solar for installation life span
  let yearlyCostWithoutSolar: number[] = [...Array(installationLifeSpan).keys()].map(
    (year) => (monthlyAverageEnergyBill * 12 * costIncreaseFactor ** year) / discountRate ** year,
  );
  let totalCostWithoutSolar: number = yearlyCostWithoutSolar.reduce((x, y) => x + y, 0);
  console.log(`Cost without solar: $${totalCostWithoutSolar.toFixed(2)}`);

  // Savings with solar for installation life span
  let savings: number = totalCostWithoutSolar - totalCostWithSolar;
  console.log(`Savings: $${savings.toFixed(2)} in ${installationLifeSpan} years`);
  // [END solar_potential_calculations]

  // Reactive calculations
  let panelCapacityRatio: number = 1.0;
  $: panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacityWatts;
  $: installationCostTotal = installationCostPerWatt * installationSizeKw * 1000;
  $: if (solarPanelConfigs[configId]) {
    installationSizeKw = (solarPanelConfigs[configId].panelsCount * panelCapacityWattsInput) / 1000;
  }
  $: monthlyKwhEnergyConsumption = monthlyAverageEnergyBillInput / energyCostPerKwhInput;
  $: yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
  $: if (solarPanelConfigs[configId]) {
    initialAcKwhPerYear =
      solarPanelConfigs[configId].yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerateInput;
  }
  $: yearlyProductionAcKwh = [...Array(installationLifeSpan).keys()].map(
    (year) => initialAcKwhPerYear * efficiencyDepreciationFactor ** year,
  );
  $: yearlyUtilityBillEstimates = yearlyProductionAcKwh.map((yearlyKwhEnergyProduced, year) => {
    const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
    const billEstimate =
      (billEnergyKwh * energyCostPerKwhInput * costIncreaseFactor ** year) / discountRate ** year;
    return Math.max(billEstimate, 0); // bill cannot be negative
  });
  $: remainingLifetimeUtilityBill = yearlyUtilityBillEstimates.reduce((x, y) => x + y, 0);
  $: totalCostWithSolar = installationCostTotal + remainingLifetimeUtilityBill - solarIncentives;
  $: yearlyCostWithoutSolar = [...Array(installationLifeSpan).keys()].map(
    (year) =>
      (monthlyAverageEnergyBillInput * 12 * costIncreaseFactor ** year) / discountRate ** year,
  );
  $: totalCostWithoutSolar = yearlyCostWithoutSolar.reduce((x, y) => x + y, 0);
  $: savings = totalCostWithoutSolar - totalCostWithSolar;

  let energyCovered: number;
  $: energyCovered = yearlyProductionAcKwh[0] / yearlyKwhEnergyConsumption;

  let breakEvenYear: number = -1;
  $: GoogleCharts.load(
    () => {
      if (!costChart) {
        return;
      }
      const year = new Date().getFullYear();

      let costWithSolar = 0;
      const cumulativeCostsWithSolar = yearlyUtilityBillEstimates.map(
        (billEstimate, i) =>
          (costWithSolar +=
            i == 0 ? billEstimate + installationCostTotal - solarIncentives : billEstimate),
      );
      let costWithoutSolar = 0;
      const cumulativeCostsWithoutSolar = yearlyCostWithoutSolar.map(
        (cost) => (costWithoutSolar += cost),
      );
      breakEvenYear = cumulativeCostsWithSolar.findIndex(
        (costWithSolar, i) => costWithSolar <= cumulativeCostsWithoutSolar[i],
      );

      const data = google.visualization.arrayToDataTable([
        ['Year', 'Solar', 'No solar'],
        [year.toString(), 0, 0],
        ...cumulativeCostsWithSolar.map((_, i) => [
          (year + i + 1).toString(),
          cumulativeCostsWithSolar[i],
          cumulativeCostsWithoutSolar[i],
        ]),
      ]);

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const googleCharts = google.charts as any;
      const chart = new googleCharts.Line(costChart);
      const options = googleCharts.Line.convertOptions({
        title: `Cost analysis for ${installationLifeSpan} years`,
        width: 350,
        height: 200,
      });
      chart.draw(data, options);
    },
    { packages: ['line'] },
  );

  function updateConfig() {
    monthlyKwhEnergyConsumption = monthlyAverageEnergyBillInput / energyCostPerKwhInput;
    yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
    panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacityWatts;
    configId = findSolarConfig(
      solarPanelConfigs,
      yearlyKwhEnergyConsumption,
      panelCapacityRatio,
      dcToAcDerateInput,
    );
  }

  // Equipment specifications for display
  let panelEfficiency = 22.8; // Q-Solar Elite efficiency
  let inverterCapacity = 11.4; // Q-Power X2 capacity in kW
  let panelDimensions = {
    length: 1855,
    width: 1038,
    height: 35,
  }; // Q-Solar Elite dimensions
</script>

<div class="solar-potential-section">
  <div class="analysis-inputs">
    <Expandable
      bind:section={expandedSection}
      {icon}
      {title}
      subtitle="Values are only placeholders."
      subtitle2="Update with your own values."
      secondary
    >
      <div class="flex flex-col space-y-4 pt-1">
        <div class="p-4 mb-4 surface-variant outline-text rounded-lg">
          <p class="relative inline-flex items-center space-x-2">
            <md-icon class="md:w-6 w-8">info</md-icon>
            <span>
              Projections use a
              <a
                class="primary-text"
                href="https://developers.google.com/maps/documentation/solar/calculate-costs-us"
                target="_blank"
              >
                USA financial model
                <md-icon class="text-sm">open_in_new</md-icon>
              </a>
            </span>
          </p>
        </div>

        <!-- Energy Cost Card -->
        <EnergyCostCard
          energyData={regionalEnergyData}
          isLoading={isLoadingEnergyData}
          hasError={energyDataError}
          errorMessage={energyDataErrorMessage}
          currentEnergyCost={energyCostPerKwhInput}
        />

        <InputMoney
          bind:value={monthlyAverageEnergyBillInput}
          icon="credit_card"
          label="Monthly average energy bill"
          onChange={updateConfig}
        />

        <div class="inline-flex items-center space-x-2">
          <div class="grow">
            <InputPanelsCount bind:configId {solarPanelConfigs} />
          </div>
          <md-icon-button role={undefined} on:click={updateConfig}>
            <md-icon>sync</md-icon>
          </md-icon-button>
        </div>

        <InputMoney
          bind:value={energyCostPerKwhInput}
          icon="paid"
          label="Energy cost per kWh"
          onChange={updateConfig}
        />

        <InputMoney
          bind:value={solarIncentives}
          icon="redeem"
          label="Solar incentives"
          onChange={updateConfig}
        />

        <InputMoney
          bind:value={installationCostPerWatt}
          icon="request_quote"
          label="Installation cost per Watt"
          onChange={updateConfig}
        />

        <InputNumber
          bind:value={panelCapacityWattsInput}
          icon="bolt"
          label="Panel capacity"
          suffix="Watts"
          onChange={updateConfig}
        />

        <div class="flex flex-col items-center w-full">
          <md-text-button
            trailing-icon
            role={undefined}
            on:click={() => (showAdvancedSettings = !showAdvancedSettings)}
          >
            {showAdvancedSettings ? 'Hide' : 'Show'} advanced settings
            <md-icon slot="icon">
              {showAdvancedSettings ? 'expand_less' : 'expand_more'}
            </md-icon>
          </md-text-button>
        </div>

        {#if showAdvancedSettings}
          <div class="flex flex-col space-y-4" transition:slide={{ duration: 200 }}>
            <InputNumber
              bind:value={installationLifeSpan}
              icon="date_range"
              label="Installation lifespan"
              suffix="years"
              onChange={updateConfig}
            />

            <InputPercent
              bind:value={dcToAcDerateInput}
              icon="dynamic_form"
              label="DC to AC conversion "
              onChange={updateConfig}
            />

            <InputRatio
              bind:value={efficiencyDepreciationFactor}
              icon="trending_down"
              label="Panel efficiency decline per year"
              decrease
              onChange={updateConfig}
            />

            <InputRatio
              bind:value={costIncreaseFactor}
              icon="price_change"
              label="Energy cost increase per year"
              onChange={updateConfig}
            />

            <InputRatio
              bind:value={discountRate}
              icon="local_offer"
              label="Discount rate per year"
              onChange={updateConfig}
            />
          </div>
        {/if}

        <div class="grid justify-items-end">
          <md-filled-tonal-button
            trailing-icon
            role={undefined}
            href="https://developers.google.com/maps/documentation/solar/calculate-costs-us"
            target="_blank"
          >
            More details
            <md-icon slot="icon">open_in_new</md-icon>
          </md-filled-tonal-button>
        </div>
      </div>
    </Expandable>

    <div class="absolute top-0 left-0">
      {#if expandedSection == title}
        <div class="flex flex-col space-y-2 m-2">
          <SummaryCard
            {icon}
            {title}
            rows={[
              {
                icon: 'energy_savings_leaf',
                name: 'Yearly energy',
                value: showNumber(
                  (solarPanelConfigs[configId]?.yearlyEnergyDcKwh ?? 0) * panelCapacityRatio,
                ),
                units: 'kWh',
              },
              {
                icon: 'speed',
                name: 'Installation size',
                value: showNumber(installationSizeKw),
                units: 'kW',
              },
              {
                icon: 'request_quote',
                name: 'Installation cost',
                value: showMoney(installationCostTotal),
              },
              {
                icon: [
                  'battery_0_bar',
                  'battery_1_bar',
                  'battery_2_bar',
                  'battery_3_bar',
                  'battery_4_bar',
                  'battery_5_bar',
                  'battery_full',
                ][Math.floor(Math.min(Math.round(energyCovered * 100) / 100, 1) * 6)],
                name: 'Energy covered',
                value: Math.round(energyCovered * 100).toString(),
                units: '%',
              },
            ]}
          />
        </div>

        <div class="mx-2 p-4 surface on-surface-text rounded-lg shadow-lg">
          <div bind:this={costChart} />
          <div class="w-full secondary-text">
            <Table
              rows={[
                {
                  icon: 'wallet',
                  name: 'Cost without solar',
                  value: showMoney(totalCostWithoutSolar),
                },
                {
                  icon: 'wb_sunny',
                  name: 'Cost with solar',
                  value: showMoney(totalCostWithSolar),
                },
                {
                  icon: 'savings',
                  name: 'Savings',
                  value: showMoney(savings),
                },
                {
                  icon: 'balance',
                  name: 'Break even',
                  value:
                    breakEvenYear >= 0
                      ? `${breakEvenYear + new Date().getFullYear() + 1} in ${breakEvenYear + 1}`
                      : '--',
                  units: 'years',
                },
                {
                  icon: 'payments',
                  name: 'Monthly energy cost',
                  value: showMoney(monthlyKwhEnergyConsumption * energyCostPerKwhInput),
                },
              ]}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Equipment specs moved below the analysis section -->
<div class="equipment-specs mt-8">
  <div class="panel-specs">
    <h3>Panel Specifications (Q-Solar Elite)</h3>
    <ul>
      <li>Wattage: {panelCapacityWattsInput}W</li>
      <li>Efficiency: {panelEfficiency}%</li>
      <li>Warranty: {installationLifeSpan} years</li>
      <li>
        Dimensions: {panelDimensions.length} x {panelDimensions.width} x {panelDimensions.height} mm
      </li>
    </ul>
  </div>

  <div class="inverter-specs">
    <h3>Inverter Specifications (Q-Power X2)</h3>
    <ul>
      <li>Capacity: {inverterCapacity} kW</li>
      <li>Efficiency: {dcToAcDerateInput * 100}%</li>
      <li>Features: Smart monitoring, Battery ready, Rapid shutdown, Dual MPPT</li>
    </ul>
  </div>
</div>

<style>
  .equipment-specs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(26, 26, 26, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
  }

  .panel-specs,
  .inverter-specs {
    padding: 1rem;
  }

  h3 {
    color: var(--md-sys-color-primary-light);
    margin-bottom: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin-bottom: 0.5rem;
    color: var(--md-sys-color-on-surface-dark);
  }

  /* Add orange color to the Solar Potential analysis title and icon */
  :global(.solar-potential-section md-icon:first-child) {
    color: var(--md-sys-color-primary-light) !important;
  }

  :global(.solar-potential-section .body-large) {
    color: var(--md-sys-color-primary-light) !important;
  }
</style>
