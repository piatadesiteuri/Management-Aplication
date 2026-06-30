// Test manual pentru calculul rest final
// Conform formulei din Excel: Rest final = Rest început + Alimentat lichid + Alimentat echivalent - Consum efectiv

console.log('🧮 Test manual pentru calculul rest final');

// Datele din imaginea utilizatorului pentru rândul 3 (06.12.2025):
const testData = {
    start_day_fuel_liters: 8.30,    // REST ÎNC. (L)
    liquid_fuel_added: 34.87,       // ALIM. LIQ. (L)
    equivalent_liters: 0.00,        // ALIM. ECH. (L) - din imagine este 0.00
    actual_consumption_liters: 14.49 // CONS. EFECT. (L)
};

// Calculul conform formulei corecte
const calculatedEndFuel = testData.start_day_fuel_liters + testData.liquid_fuel_added + testData.equivalent_liters - testData.actual_consumption_liters;

console.log('📊 Datele de test:');
console.log(`  Rest început: ${testData.start_day_fuel_liters}L`);
console.log(`  Alimentat lichid: ${testData.liquid_fuel_added}L`);
console.log(`  Alimentat echivalent: ${testData.equivalent_liters}L`);
console.log(`  Consum efectiv: ${testData.actual_consumption_liters}L`);

console.log('\n🧮 Calculul:');
console.log(`  Rest final = ${testData.start_day_fuel_liters} + ${testData.liquid_fuel_added} + ${testData.equivalent_liters} - ${testData.actual_consumption_liters}`);
console.log(`  Rest final = ${calculatedEndFuel}L`);

console.log('\n✅ Rezultatul așteptat: 28.68L');
console.log(`✅ Rezultatul calculat: ${calculatedEndFuel}L`);
console.log(`✅ Calculul este corect: ${Math.abs(calculatedEndFuel - 28.68) < 0.01 ? 'DA' : 'NU'}`);

// Test pentru rândul 1 (01.12.2025):
const testDataRow1 = {
    start_day_fuel_liters: 13.51,
    liquid_fuel_added: 0.00,
    equivalent_liters: 0.00,
    actual_consumption_liters: 3.11
};

const calculatedEndFuelRow1 = testDataRow1.start_day_fuel_liters + testDataRow1.liquid_fuel_added + testDataRow1.equivalent_liters - testDataRow1.actual_consumption_liters;

console.log('\n📊 Test pentru rândul 1 (01.12.2025):');
console.log(`  Rest final calculat: ${calculatedEndFuelRow1}L`);
console.log(`  Rezultatul așteptat din Excel: 10.40L`);
console.log(`  Calculul este corect: ${Math.abs(calculatedEndFuelRow1 - 10.40) < 0.01 ? 'DA' : 'NU'}`);
