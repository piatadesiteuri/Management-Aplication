import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
  ModalBody,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Input,
  Select,
    VStack,
  SimpleGrid,
  useToast,
  FormErrorMessage,
    Textarea,
  Box,
  Divider,
  Text,
  HStack,
  Icon,
  NumberInput,
  NumberInputField,
  Spinner,
} from '@chakra-ui/react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiFileText, FiHome } from 'react-icons/fi';
import { useState, useEffect, useCallback } from 'react';
import { Supplier, SupplierStatus } from '../../types/supply';
import { SupplyService } from '../../services/supply/SupplyService';
import { debounce } from 'lodash';

interface SupplierFormModalProps {
    isOpen: boolean;
    onClose: () => void;
  supplier?: Supplier | null;
    onSuccess: () => void;
}

// Date pentru județele și orașele din România
const ROMANIAN_COUNTIES = [
  { code: 'AB', name: 'Alba' },
  { code: 'AR', name: 'Arad' },
  { code: 'AG', name: 'Argeș' },
  { code: 'BC', name: 'Bacău' },
  { code: 'BH', name: 'Bihor' },
  { code: 'BN', name: 'Bistrița-Năsăud' },
  { code: 'BT', name: 'Botoșani' },
  { code: 'BV', name: 'Brașov' },
  { code: 'BR', name: 'Brăila' },
  { code: 'BZ', name: 'Buzău' },
  { code: 'CS', name: 'Caraș-Severin' },
  { code: 'CL', name: 'Călărași' },
  { code: 'CJ', name: 'Cluj' },
  { code: 'CT', name: 'Constanța' },
  { code: 'CV', name: 'Covasna' },
  { code: 'DB', name: 'Dâmbovița' },
  { code: 'DJ', name: 'Dolj' },
  { code: 'GL', name: 'Galați' },
  { code: 'GR', name: 'Giurgiu' },
  { code: 'GJ', name: 'Gorj' },
  { code: 'HR', name: 'Harghita' },
  { code: 'HD', name: 'Hunedoara' },
  { code: 'IL', name: 'Ialomița' },
  { code: 'IS', name: 'Iași' },
  { code: 'IF', name: 'Ilfov' },
  { code: 'MM', name: 'Maramureș' },
  { code: 'MH', name: 'Mehedinți' },
  { code: 'MS', name: 'Mureș' },
  { code: 'NT', name: 'Neamț' },
  { code: 'OT', name: 'Olt' },
  { code: 'PH', name: 'Prahova' },
  { code: 'SM', name: 'Satu Mare' },
  { code: 'SJ', name: 'Sălaj' },
  { code: 'SB', name: 'Sibiu' },
  { code: 'SV', name: 'Suceava' },
  { code: 'TR', name: 'Teleorman' },
  { code: 'TM', name: 'Timiș' },
  { code: 'TL', name: 'Tulcea' },
  { code: 'VS', name: 'Vaslui' },
  { code: 'VL', name: 'Vâlcea' },
  { code: 'VN', name: 'Vrancea' },
  { code: 'B', name: 'București' }
];

// Orașe și comune complete pentru toate județele României
const CITIES_BY_COUNTY: Record<string, string[]> = {
  'AB': ['Alba Iulia', 'Sebeș', 'Aiud', 'Blaj', 'Câmpeni', 'Cugir', 'Ocna Mureș', 'Zlatna', 'Abrud', 'Teiuș', 'Ighiu', 'Vinerea', 'Șona', 'Șibot', 'Răhău', 'Pianu', 'Meteș', 'Livezile', 'Jidvei', 'Hopârta', 'Gârbova', 'Galda de Jos', 'Fărău', 'Cricău', 'Ciugud', 'Ciuruleasa', 'Cergău', 'Bucium', 'Berghin', 'Blandiana'],
  'AR': ['Arad', 'Ineu', 'Lipova', 'Pecica', 'Sântana', 'Sebiș', 'Chișineu-Criș', 'Curtici', 'Nădlac', 'Săvârșin', 'Gurahonț', 'Criș', 'Dezna', 'Macea', 'Pâncota', 'Șiria', 'Șimand', 'Vladimirescu', 'Fântânele', 'Grăniceri', 'Iratoșu', 'Olari', 'Sânnicolau Mare', 'Socodor', 'Șagu', 'Taut', 'Vinga', 'Zerind', 'Zăbrani', 'Zarand'],
  'AG': ['Pitești', 'Câmpulung', 'Curtea de Argeș', 'Mioveni', 'Ștefănești', 'Topoloveni', 'Costești', 'Băiculești', 'Bascov', 'Bradu', 'Budeasa', 'Bugești', 'Câmpulung', 'Cocu', 'Corbeni', 'Dâmbovicioara', 'Domneși', 'Hârtiești', 'Leordeni', 'Mălureni', 'Mihăilești', 'Mioarele', 'Moșoaia', 'Nucet', 'Oarja', 'Poienarii de Argeș', 'Rătești', 'Recea', 'Rociu', 'Ștefănești', 'Tigveni', 'Uda', 'Ungheni', 'Valea Danului', 'Valea Iașului', 'Vedea', 'Vladești'],
  'BC': ['Bacău', 'Onești', 'Moinești', 'Comănești', 'Buhuși', 'Târgu Ocna', 'Slănic-Moldova', 'Hemeiuș', 'Dărmănești', 'Podu Turcului', 'Buhoci', 'Sascut', 'Răcăciuni', 'Parincea', 'Motoseni', 'Măgura', 'Livezi', 'Letea Veche', 'Huruiești', 'Horgești', 'Hemeius', 'Ghimeș-Făget', 'Gârleni', 'Filipeni', 'Faraoani', 'Dealu Morii', 'Colonești', 'Cleja', 'Căiuți', 'Berești-Bistrița', 'Ardeoani'],
  'BH': ['Oradea', 'Salonta', 'Beius', 'Marghita', 'Aleșd', 'Valea lui Mihai', 'Ștei', 'Săcueni', 'Nucet', 'Tileagd', 'Vașcău', 'Câmpani', 'Holod', 'Dobrești', 'Spinuș', 'Tinca', 'Paleu', 'Gepiu', 'Borod', 'Bratca', 'Bulz', 'Buntești', 'Căpâlna', 'Ceica', 'Cefa', 'Cherechiu', 'Ciumeghiu', 'Copăcel', 'Criștioru de Jos', 'Curăți', 'Curtuișeni', 'Derna', 'Dijr', 'Drăgănești', 'Drăgești', 'Finiș', 'Girișu de Criș', 'Hidișelu de Sus', 'Husasău de Tinca', 'Lazuri de Beius', 'Lăzăreni', 'Lugașu de Jos'],
  'BN': ['Bistrița', 'Beclean', 'Năsăud', 'Sângeorz-Băi', 'Lechinț', 'Țaga', 'Budești', 'Dumitra', 'Livezile', 'Monor', 'Nimigea de Jos', 'Nimigea de Sus', 'Rebra', 'Rodna', 'Romuli', 'Salva', 'Sant', 'Șieu-Măgheruș', 'Șieu-Odorhei', 'Spermezeu', 'Șanț', 'Teaca', 'Tiha Bârgăului', 'Urmeniș', 'Zagra', 'Feldru', 'Brancea', 'Coșbuc', 'Dobric', 'Lesu', 'Maieru', 'Măieru', 'Miceștii de Câmpie', 'Micești', 'Negrilești', 'Parva', 'Petru Rareș'],
  'BT': ['Botoșani', 'Dorohoi', 'Darabani', 'Săveni', 'Flămânzi', 'Ștefănești', 'Bucecea', 'Curtești', 'Coșula', 'Corni', 'Havârna', 'Hlipiceni', 'Hudești', 'Ibănești', 'Lozna', 'Mihălășeni', 'Mihai Eminescu', 'Nicolae Bălcescu', 'Pomârla', 'Răchiți', 'Rechea', 'Roma', 'Românești', 'Santa Mare', 'Șendriceni', 'Suharău', 'Trușești', 'Tudora', 'Ungureni', 'Vârfu Câmpului', 'Vlăsinești', 'Vorniceni', 'Copalău', 'George Enescu', 'Drăgușeni'],
  'BV': ['Brașov', 'Făgăraș', 'Săcele', 'Codlea', 'Zărnești', 'Predeal', 'Râșnov', 'Ghimbav', 'Rucăr', 'Bran', 'Moieciu de Sus', 'Șinca', 'Vulcan', 'Victoria', 'Ucea de Sus', 'Cristian', 'Hălchiu', 'Jibert', 'Lisa', 'Măieruș', 'Ormeniș', 'Podu Dâmboviței', 'Prejmer', 'Sânpetru', 'Șercaia', 'Teliu', 'Tohanu Nou', 'Șona', 'Voila', 'Vama Buzăului', 'Ungra', 'Tărlungeni', 'Stupini', 'Soars', 'Sita Buzăului', 'Sercaia', 'Sânpetru'],
  'BR': ['Brăila', 'Ianca', 'Însurăței', 'Făurei', 'Rământu Sărat', 'Roșiori', 'Movila Miresii', 'Gropeni', 'Cazasu', 'Chiscani', 'Ciocile', 'Cireșu', 'Dudești', 'Frecăței', 'Gemenele', 'Gropeni', 'Jirlău', 'Măxineni', 'Mircea Vodă', 'Rămnicelu', 'Salcia Tudor', 'Scortaru Nou', 'Siliștea', 'Stăncuța', 'Șuțești', 'Tichilești', 'Traian', 'Tudor Vladimirescu', 'Ulmu', 'Unirea', 'Vadeni', 'Victoria', 'Viziru', 'Vădeni'],
  'BZ': ['Buzău', 'Râmnicu Sărat', 'Nehoiu', 'Pogoanele', 'Pătârlagele', 'Vernești', 'Amaru', 'Balta Albă', 'Beceni', 'Bisoca', 'Boldu', 'Bozioru', 'Brăești', 'Breaza', 'Calvini', 'Cârligi', 'Cernătești', 'Chiliile', 'Chiojdu', 'Cislău', 'Cochirleanca', 'Colți', 'Costești', 'Crăciunelu', 'Gherăseni', 'Glodeanu-Siliștea', 'Grebanu', 'Largu', 'Lopătari', 'Luciu', 'Mărăcineni', 'Mărgăritești', 'Naeni', 'Odăile', 'Padina', 'Pâclele', 'Pietroasele', 'Puiești', 'Săhăteni', 'Săpoca', 'Smeeni', 'Tișița', 'Ulmeni', 'Unguriu', 'Vadu Pașii', 'Vipești', 'Zărnești'],
  'CS': ['Reșița', 'Caransebeș', 'Lugoj', 'Oțelu Roșu', 'Anina', 'Băile Herculane', 'Bocșa', 'Moldova Nouă', 'Orșova', 'Armeniș', 'Băuțar', 'Berlișag', 'Berzasca', 'Bozovici', 'Brebu', 'Brebu Nou', 'Bucoșnița', 'Caraș', 'Căvăran', 'Ciudanovița', 'Ciuchici', 'Cornea', 'Coronini', 'Crușovița', 'Dalboșeț', 'Doclin', 'Dognecea', 'Domasnea', 'Eftimie Murgu', 'Ezeris', 'Farliug', 'Forotic', 'Fântan', 'Glimboca', 'Goruia', 'Lăpușnicu Mare', 'Luncavița', 'Măru', 'Mehadia', 'Mehadica', 'Ciuta'],
  'CL': ['Călărași', 'Oltenița', 'Lehliu Gară', 'Budești', 'Fundulea', 'Chirnogi', 'Ștefan Vodă', 'Alexandru Odobescu', 'Belciugatele', 'Borcea', 'Cascioarele', 'Ciocănești', 'Cocora', 'Curcani', 'Dichiseni', 'Dor Mărunt', 'Dragoș Vodă', 'Frăsinet', 'Gălbinași', 'Gurbănești', 'Gâlcești', 'Grădiștea', 'Gurbanești', 'Independența', 'Ileana', 'Jegălia', 'Lehliu Sat', 'Luică', 'Mânăstirea', 'Modelu', 'Nana', 'Nicolae Bălcescu', 'Perisoru', 'Plătărești', 'Radovanu', 'Roseți', 'Sărulești', 'Șoldanu', 'Spanțov', 'Ștefan cel Mare', 'Tămădău', 'Ulmu', 'Unirea', 'Valea Argovei', 'Vasilați', 'Vlad Țepeș'],
  'CJ': ['Cluj-Napoca', 'Dej', 'Turda', 'Câmpia Turzii', 'Gherla', 'Huedin', 'Apahida', 'Florești', 'Băișoara', 'Beliș', 'Bobâlna', 'Borșa', 'Buza', 'Calarași', 'Căianu', 'Călățele', 'Căpușu Mare', 'Ceanu Mare', 'Chinteni', 'Ciucea', 'Ciurila', 'Cojocna', 'Cornești', 'Cuzăplac', 'Dăbâca', 'Feleacu', 'Fizeșu Gherlii', 'Floreștii de Sus', 'Gârbău', 'Gilău', 'Iara', 'Iclod', 'Ileanda', 'Jichișu de Jos', 'Jucu', 'Luna', 'Luna de Sus', 'Măguri-Răcătău', 'Mărgău', 'Mărtinești', 'Mica', 'Mihai Viteazu', 'Mintiu Gherlii', 'Mociu', 'Moldovenești', 'Negreni', 'Palatca', 'Panticeu', 'Petreștii de Jos', 'Ploscoș', 'Poieni', 'Recea-Cristur', ' Riu de Mori', 'Săcuieu', 'Săndulești', 'Sânmărtin', 'Sânpaul', 'Săvădisla', 'Unguraș', 'Vultureni', 'Zagra'],
  'CT': ['Constanța', 'Mangalia', 'Medgidia', 'Năvodari', 'Cernavodă', 'Eforie', 'Murfatlar', 'Ovidiu', 'Techirghiol', 'Băneasa', 'Adamclisi', 'Agigea', 'Albești', 'Aliman', 'Amzacea', 'Bărăganu', 'Casimcea', 'Castelu', 'Cerchezu', 'Chirnogeni', 'Ciobanu', 'Ciocârlia', 'Cobadin', 'Comana', 'Corbu', 'Costinești', 'Crucea', 'Cuza Vodă', 'Deleni', 'Dobromir', 'Dumbrava', 'Fântânele', 'Gârliciu', 'General Scărișoreanu', 'Grădina', 'Hârsova', 'Horia', 'Ion Corvin', 'Istria', 'Limanu', 'Lipnița', 'Lumina', 'Mereni', 'Mihail Kogălniceanu', 'Mihai Viteazu', 'Mircea Vodă', 'Nicolae Bălcescu', 'Oltina', 'Ostrov', 'Pantelimon', 'Pecineaga', 'Peștera', 'Poarta Albă', 'Rasova', 'Sacele', 'Saraiu', 'Seimeni', 'Ștefan cel Mare', 'Târgușor', 'Tuzla', 'Topalu', 'Topraisar', 'Tortoman', 'Tuzla', 'Valu lui Traian', 'Vâlcele', 'Vama Veche', 'Vișina'],
  'CV': ['Sfântu Gheorghe', 'Târgu Secuiesc', 'Covasna', 'Baraolt', 'Întorsura Buzăului', 'Aita Mare', 'Barcani', 'Bățani', 'Bodoc', 'Boroșneu Mare', 'Brețcu', 'Catalina', 'Chichiș', 'Comandău', 'Dobârlău', 'Estelnic', 'Ghelinț', 'Ghidfalău', 'Haghig', 'Lemnia', 'Măieruș', 'Malnaș', 'Micfalău', 'Naruja', 'Ojdula', 'Ozun', 'Sânzieni', 'Șinca', 'Turia', 'Vâlcele', 'Varghiș', 'Zagon', 'Zăbala'],
  'DB': ['Târgoviște', 'Moreni', 'Pucioasa', 'Fieni', 'Găești', 'Titu', 'Răcari', 'Șotânga', 'Aninoasa', 'Bezdead', 'Bilciurești', 'Braniștea', 'Brezoaele', 'Bucșani', 'Cândeștii-Vale', 'Cobia', 'Cojasca', 'Comișani', 'Cornățelu', 'Crevedia', 'Dărmănești', 'Davidești', 'Doicești', 'Dragodana', 'Finta', 'Glodeni', 'Gura Foii', 'Gura Ocniței', 'Hulubești', 'I.L.Caragiale', 'Iedera', 'Lucieni', 'Lunguletu', 'Mănești', 'Măneștii de Sus', 'Mărcești', 'Mogoșani', 'Morteni', 'Nucet', 'Ocnița', 'Petrești', 'Pietroșița', 'Potlogi', 'Produlești', 'Pucheni', 'Râu Alb', 'Rochieni', 'Runcu', 'Șelaru', 'Șotânga', 'Tărtășești', 'Ulmi', 'Ungheni', 'Uliești', 'Valea Lung', 'Valea Mare', 'Vicovul de Sus', 'Visina', 'Vlădești', 'Vulcana-Băi', 'Vulcana-Pandele'],
  'DJ': ['Craiova', 'Băilești', 'Calafat', 'Segarcea', 'Dăbuleni', 'Filiași', 'Motru', 'Strehaia', 'Bechet', 'Corabia', 'Işalnița', 'Podari', 'Amărăștii de Jos', 'Amărăștii de Sus', 'Apele Vii', 'Argetoaia', 'Bălașin', 'Bălcești', 'Balta Verde', 'Bărbăteștii de Sus', 'Bărboi', 'Basarabi', 'Brădești', 'Breasta', 'Braloștița', 'Bucovăț', 'Busu', 'Calopăr', 'Calopar', 'Călugăreni', 'Carcea', 'Celaru', 'Cerăt', 'Cleanov', 'Coșoveni de Jos', 'Coțofenii din Dos', 'Coțofenii din Față', 'Crăgueni', 'Desa', 'Dioștiți', 'Drănic', 'Drăgotești', 'Galiciuica', 'Ghercești', 'Ghindeni', 'Giubega', 'Goești', 'Goiași', 'Grecești', 'Horezu', 'Hurducea', 'Ișalnița', 'Izvoare', 'Jiene', 'Leu', 'Lipovu', 'Maglavit', 'Melinești', 'Malu Mare', 'Mehedinți', 'Mischii', 'Moțăței', 'Negoi', 'Orodel', 'Ostroveni', 'Peșteana', 'Pieleștii de Jos', 'Pieleștii de Sus', 'Pleșoi', 'Podari', 'Poiana Mare', 'Rojiște', 'Sadova', 'Scăești', 'Șimnicu de Sus', 'Teasc', 'Terpezița', 'Tomești', 'Tuglui', 'Urzica', 'Valea Stanciului', 'Vârtop', 'Verbiță', 'Vârvorul de Jos', 'Viișoara', 'Vinjulești', 'Zaval', 'Zănoaga'],
  'GL': ['Galați', 'Tecuci', 'Târgu Bujor', 'Berești', 'Drăgănești', 'Măstăcani', 'Măxineni', 'Pechea', 'Schela', 'Tufeștii de Sus', 'Berești-Meria', 'Braniștea', 'Buciumeni', 'Cavadinești', 'Corod', 'Corni', 'Costache Negri', 'Cudalbi', 'Cuza Vodă', 'Drăgușeni', 'Fântânele', 'Folteștii de Sus', 'Frumușița', 'Fundeni', 'Găiceana', 'Ghidigeni', 'Gohor', 'Grivița', 'Hulubi', 'Independența', 'Ivești', 'Jorăști', 'Lozinca', 'Matca', 'Movileni', 'Munteni', 'Nămoloasa', 'Nicorești', 'Oancea', 'Piscu', 'Poiana', 'Pribegi', 'Rediu', 'Recea', 'Scânteia', 'Smârdan', 'Șendreni', 'Șuțești', 'Târgu Bujor', 'Țepu', 'Tudor Vladimirescu', 'Tulucești', 'Umbrarești', 'Valea Mărului', 'Vânători', 'Vlădești', 'Vlașin'],
  'GR': ['Giurgiu', 'Bolintin-Vale', 'Mihăilești', 'Adunatii-Copăceni', 'Băneasa', 'Bilciurești', 'Bolintin-Deal', 'Bucșani', 'Bucsani', 'Bulbucata', 'Buturugeni', 'Calugareni', 'Clejani', 'Comorasti', 'Cosoba', 'Daia', 'Florești-Stoenești', 'Fratești', 'Găiseni', 'Găujani', 'Gostinu', 'Gostinari', 'Greaca', 'Herasti', 'Hotarele', 'Iepuresti', 'Izvoarele', 'Joita', 'Letca Noua', 'Lipia', 'Malu', 'Marchesti', 'Mihai Bravu', 'Mihailesti', 'Ogrezeni', 'Oinacu', 'Prundu', 'Putred', 'Racari', 'Roata de Jos', 'Sabareni', 'Schitu', 'Singureni', 'Stefanestii de Jos', 'Stoenesti', 'Toporu', 'Ulmi', 'Vanatorii Mici', 'Vedea', 'Vladimirescu'],
  'GJ': ['Târgu Jiu', 'Motru', 'Rovinari', 'Țicleni', 'Târgu Cărbunești', 'Bumbeștii de Jos', 'Novaci', 'Baia de Fier', 'Țânțăreni', 'Peștișani', 'Bărbățeștii de Sus', 'Albeni', 'Alimpeștii', 'Arcani', 'Bălănești', 'Bălești', 'Bengeștii de Sus', 'Berlești', 'Bolboși', 'Brănești', 'Bustuchin', 'Căpreni', 'Cătunele', 'Ciupercenii Noi', 'Crușeț', 'Dănești', 'Dănciulești', 'Fărcășești', 'Godeni', 'Godinești', 'Hurezani', 'Ionești', 'Jupânești', 'Lelești', 'Licurici', 'Logrești', 'Mătăsari', 'Mușetești', 'Negomir', 'Onicea', 'Padeș', 'Pădeștii de Sus', 'Plopsoru', 'Polovragi', 'Prigoria', 'Răchițele', 'Roșia de Amaradia', 'Runcu', 'Săcelu', 'Saulești', 'Schela', 'Scoarța', 'Stănești', 'Stoina', 'Tismana', 'Turceni', 'Țicleni', 'Urdari', 'Valea Morii', 'Văgiulești'],
  'HR': ['Miercurea Ciuc', 'Odorheiu Secuiesc', 'Gheorgheni', 'Toplița', 'Cristuru Secuiesc', 'Bălan', 'Borsec', 'Suseni', 'Ulies', 'Aita Mare', 'Avrămești', 'Băile Tușnad', 'Bilbor', 'Brădești', 'Căpălin', 'Ciumani', 'Ciucsângeorgiu', 'Corbu', 'Dănești', 'Danesti', 'Ditrău', 'Feliceni', 'Frumoasa', 'Gălăuțaș', 'Joseni', 'Leliceni', 'Lunca Brădului', 'Lunca de Jos', 'Lunca de Sus', 'Mărtiniș', 'Mărtiniș', 'Merești', 'Mihăileni', 'Plăieș de Jos', 'Plăieș de Sus', 'Praid', 'Răstolița', 'Remetea', 'Sâncrăieni', 'Sânsimion', 'Sărmaș', 'Siculeni', 'Subcetate', 'Șimonești', 'Tulgheș', 'Tusnád', 'Zetea'],
  'HD': ['Deva', 'Hunedoara', 'Petroșani', 'Lupeni', 'Vulcan', 'Petrila', 'Orăștie', 'Aninoasa', 'Călan', 'Hațeg', 'Brad', 'Geoagiu', 'Simeria', 'Uricani', 'Băcia', 'Băița', 'Bănic', 'Băuțar', 'Bácsi', 'Blăjeni', 'Boșorod', 'Boiu', 'Brănișca', 'Bretea Română', 'Bretea Mureșan', 'Bulzești', 'Bunila', 'Burjuc', 'Buceș', 'Căprioara', 'Cărpiniș', 'Certeju de Sus', 'Crișcior', 'Densuș', 'Dobra', 'Fărău', 'General Berthelot', 'Gelmar', 'Gurasada', 'Hălmagiu', 'Hălmăgel', 'Harău', 'Hășdat', 'Lăpugiu de Jos', 'Lunca', 'Luncoiu de Jos', 'Mărtinești', 'Mănerău', 'Pestișu Mic', 'Pianu de Jos', 'Pui', 'Râu de Mori', 'Răchitova', 'Ribița', 'Roșcani', 'Sălașu de Sus', 'Sântămăria-Orlea', 'Sarmizegetusa', 'Șoimuș', 'Teliucu Inferior', 'Tomești', 'Toteștii de Sus', 'Țebea', 'Ulieș', 'Vălișoara', 'Vețel', 'Zam'],
  'IL': ['Slobozia', 'Fetești', 'Țăndărei', 'Fierbinți-Târg', 'Urziceni', 'Amara', 'Andrașești', 'Armășești', 'Axintele', 'Bărcănești', 'Bărăști', 'Bentu', 'Boranești', 'Borcea', 'Brazii', 'Bucu', 'Buești', 'Căscioarele', 'Ciochina', 'Ciocîrlia', 'Ciulnița', 'Cocora', 'Colelia', 'Coșereni', 'Drăgoești', 'Făcăeni', 'Giurgeni', 'Grindu', 'Gurbănești', 'Ion Roată', 'Jilavele', 'Manasia', 'Mărculeștii', 'Mihăilești', 'Miloșești', 'Movila', 'Munteni-Buzău', 'Perieti', 'Platonești', 'Reviga', 'Roșiori', 'Săveni', 'Scânteia', 'Sineștii de Sus', 'Stelnica', 'Sudiți', 'Valea Ciorii', 'Valea Măcrișului', 'Traian'],
  'IS': ['Iași', 'Pașcani', 'Târgu Frumos', 'Hârlău', 'Podu Iloaiei', 'Negrești', 'Târgu Frumos', 'Alexandru I. Cuza', 'Andrieșeni', 'Aroneanu', 'Bălțați', 'Băiceni', 'Belcești', 'Bivolari', 'Braești', 'Brănești', 'Butea', 'Ciortești', 'Ciurea', 'Coarnele Caprei', 'Comarna', 'Coșeni', 'Costești', 'Cozieni', 'Cristești', 'Cucuteni', 'Deleni', 'Dolhești', 'Erbiceni', 'Focul', 'Grajduri', 'Grozeștii', 'Grozești', 'Hălăucești', 'Halaucești', 'Helestieni', 'Holbeștii', 'Hordeștii de Jos', 'Hordeștii de Sus', 'Horlești', 'Iezăreni', 'Ion Neculce', 'Letcani', 'Lețcani', 'Lungani', 'Măgurele', 'Măgura', 'Mircești', 'Mirceștii', 'Miroslava', 'Motca', 'Oțeleni', 'Pângărați', 'Perieni', 'Plugari', 'Popești', 'Popricani', 'Prisca', 'Probota', 'Răducăneni', 'Rediu', 'Roșcani', 'Sârca', 'Scheia', 'Scânteia', 'Sinești', 'Șcheia', 'Șipote', 'Ștefan cel Mare', 'Stolniceni-Prăjești', 'Strunga', 'Tătărași', 'Tibana', 'Tomești', 'Tutova', 'Țuțora', 'Ungheni', 'Valea Lupului', 'Victoria', 'Vișțișoara', 'Vlădeni'],
  'IF': ['Buftea', 'Otopeni', 'Voluntari', 'Pantelimon', 'Popești-Leordeni', 'Chiajna', 'Bragadiru', 'Chitila', 'Măgurele', 'Tunari', 'Afumeți', 'Balotești', 'Berceni', 'Branești', 'Brănești', 'Cațalui', 'Cernica', 'Chițiu', 'Copăceni', 'Corbeanca', 'Cornetu', 'Dobroești', 'Domneștii Noi', 'Dragomirești-Deal', 'Dragomirești-Vale', 'Gănești', 'Glina', 'Grădiștea', 'Gruia', 'Jilava', 'Joița', 'Măntuleasa', 'Măneasa', 'Mărgineni', 'Ostrovu', 'Periș', 'Petrăchioaia', 'Prima Nufărul', 'Răcarii Oraș', 'Răzvani', 'Ștefăneștii de Jos', 'Snagov', 'Tâncăbești', 'Tamași', 'Vidra', 'Vișina Românească'],
  'MM': ['Baia Mare', 'Sighetu Marmației', 'Borșa', 'Vișeu de Sus', 'Târgu Lăpuș', 'Săliștea de Sus', 'Cavnic', 'Seini', 'Șomcuta Mare', 'Țăriile', 'Ardusat', 'Băiceni', 'Băiuț', 'Băsești', 'Bîrsana', 'Bistra', 'Bocicoiu Mare', 'Bogdan Vodă', 'Botiza', 'Brăteștii de Sus', 'Budești', 'Budeștii de Sus', 'Călinești', 'Câmpulung la Tisa', 'Coaș', 'Coltău', 'Copalnic-Mănăștur', 'Coroieni', 'Crăciunești', 'Cupșeni', 'Dăbală', 'Desești', 'Dumbrăvița', 'Fărcașa', 'Fântânele', 'Ferești', 'Finteusu Mare', 'Gârani', 'Giulești', 'Groapeana', 'Groșii Țibleșului', 'Hărnicești', 'Ieud', 'Lăpuș', 'Leordina', 'Mireșu Mare', 'Moisei', 'Ocna Șugatag', 'Oncești', 'Petrova', 'Poienile de sub Munte', 'Poienile Izei', 'Răzoare', 'Recea', 'Remeti', 'Repedea', 'Rona de Sus', 'Ruscova', 'Săcălășeni', 'Săcel', 'Săliștea de Sus', 'Sălsig', 'Săpânța', 'Satulung', 'Strâmtura', 'Șieu', 'Șomcuta Mare', 'Șurdești', 'Tăuții-Măgherăuș', 'Ulmeni', 'Vadu Izei', 'Valea Chioarului', 'Vârai', 'Vicea', 'Vișeu de Jos'],
  'MH': ['Drobeta-Turnu Severin', 'Orșova', 'Strehaia', 'Vânju Mare', 'Baia de Aramă', 'Balacița', 'Balta', 'Bâcleș', 'Brebeni', 'Brebu', 'Brebu Nou', 'Broșteni', 'Butoiești', 'Cernaia', 'Cerneț', 'Cireșu', 'Corlătel', 'Crăgueni', 'Dănceu', 'Devesel', 'Dubova', 'Dumbrava', 'Eselnița', 'Eșelnița', 'Florești', 'Gârla Mare', 'Gogoșu', 'Greci', 'Hinova', 'Ilovăț', 'Isvoarele', 'Jiana', 'Livezi', 'Malaia', 'Mărgineni', 'Oprișor', 'Padeș', 'Patru Frați', 'Pendu', 'Pristol', 'Punghina', 'Prunișor', 'Șimian', 'Șișești', 'Tâmna', 'Vârciorova', 'Vladimirescu'],
  'MS': ['Târgu Mureș', 'Reghin', 'Sighișoara', 'Târnăveni', 'Luduș', 'Sovata', 'Iernut', 'Dej', 'Acățari', 'Adâncata', 'Albești', 'Aluniș', 'Apold', 'Arpaș de Jos', 'Arpaşul de Jos', 'Ateaș', 'Băgaciu', 'Băla', 'Balauseri', 'Band', 'Batoș', 'Bălăușeri', 'Bereni', 'Beța', 'Bichigiu', 'Bozna', 'Brâncoveneștii de Jos', 'Breaza', 'Chibed', 'Ceuașu de Câmpie', 'Chețani', 'Chiuieștii de Jos', 'Coroisânmărtin', 'Coruș', 'Crăciunești', 'Cucerdea', 'Cuci', 'Dăneștii', 'Daneș', 'Ernei', 'Fărăgău', 'Gânța', 'Gârbova', 'Gheorghe Doja', 'Glodeni', 'Gornești', 'Grebenişu de Câmpie', 'Gurghiu', 'Hodac', 'Ibanești', 'Ibănești-Pădure', 'Icland', 'Jabenița', 'Lăsat', 'Livezeni', 'Lunca', 'Lunca Bradului', 'Măgherani', 'Măris', 'Mădăras', 'Mihesu de Câmpie', 'Muras', 'Nazna', 'Neaua', 'Ogra', 'Pâncota', 'Panet', 'Papiu Ilarian', 'Păsăreni', 'Pogăceaua', 'Răstolița', 'Râciu', 'Săcălușeni', 'Săcel', 'Sâncrai', 'Sângeorgiu de Mureș', 'Sângeorgiu de Pădure', 'Sânpetru de Câmpie', 'Sânpaul', 'Șăulia', 'Șincai', 'Șincai', 'Stânceni', 'Suseni', 'Valea Rece', 'Vătava', 'Verejeni', 'Vinca', 'Voivodeni', 'Zagar', 'Zagreu'],
  'NT': ['Piatra Neamț', 'Roman', 'Târgu Neamț', 'Bicaz', 'Roznov', 'Săvinești', 'Bălușești', 'Bicazu Ardelean', 'Cordun', 'Crăcăoani', 'Dămuc', 'Dulcești', 'Fântânele', 'Fărcașa', 'Gărcina', 'Gherăești', 'Girov', 'Horia', 'Icușești', 'Ion Creangă', 'Ișcani', 'Moldoveni', 'Motoseni', 'Negrești', 'Oniceni', 'Pâncești', 'Piatra Șoimului', 'Podoleni', 'Răucești', 'Rediu', 'Români', 'Sabaoani', 'Sagna', 'Secuieni', 'Tămășeni', 'Tarcău', 'Tașca', 'Tupilaț', 'Urecheni', 'Valea Ursului', 'Vanatori-Neamț', 'Vânători-Neamț', 'Vânători', 'Zănești'],
  'OT': ['Slatina', 'Caracal', 'Balș', 'Corabia', 'Drăgănești-Olt', 'Piatra-Olt', 'Potcoava', 'Scornicești', 'Bălteni', 'Brâncoveni', 'Călui', 'Coteana', 'Deveselu', 'Fălcoiu', 'Fărcășești', 'Gârcov', 'Ghimpețeni', 'Grojdibodu', 'Grădinari', 'Ipotești', 'Ianca', 'Izbiceni', 'Leleasca', 'Mărunței', 'Mihăești', 'Movileni', 'Nicolae Titulescu', 'Optași-Măgura', 'Orlea', 'Osica de Sus', 'Piatra-Olt', 'Priseaca', 'Redea', 'Rotunda', 'Rusănești', 'Sălătruc', 'Schitu', 'Slătioara', 'Spineni', 'Sprâncenata', 'Ștefan cel Mare', 'Ștefăneși', 'Strejeștii de Jos', 'Strejeștii de Sus', 'Studina', 'Tăslăgești', 'Tia Mare', 'Topana', 'Uda-Clocociov', 'Urzica', 'Vădastra', 'Văleni', 'Vișina', 'Vitomirești', 'Voineasa', 'Vulpeni'],
  'PH': ['Ploiești', 'Câmpina', 'Băicoi', 'Bușteni', 'Sinaia', 'Azuga', 'Breaza', 'Boldeștii de Sus', 'Mizil', 'Urlați', 'Vălenii de Munte', 'Comarnic', 'Puchenii Mari', 'Slănic', 'Adunații', 'Albești-Paleologu', 'Apostolache', 'Ariceștii Rahtivani', 'Ariceștii Zeletin', 'Baba Ana', 'Băicoi', 'Balta Doamnei', 'Bărcănești', 'Bătrâni', 'Berghin', 'Bertea', 'Blejoi', 'Boldești-Grădiștea', 'Boldești-Scăeni', 'Brazi', 'Brebu', 'Bucov', 'Cărbunești', 'Cerașu', 'Chiojdeanca', 'Ciocănești', 'Ciocești', 'Cocorăștii-Colt', 'Cocorăștii-Mislii', 'Colceag', 'Cornu', 'Cosminele', 'Dănești', 'Dumbrava', 'Filipeștii de Pădure', 'Filipeștii de Vale', 'Florești', 'Gorgota', 'Gura Vitioarei', 'Izvoarele', 'Jugureni', 'Lamiița', 'Lipănești', 'Lușcieni', 'Măgurele', 'Măgureni', 'Măneciu', 'Măneștii-Ungureni', 'Măzăreni', 'Olari', 'Păcureți', 'Păulești', 'Poiana Câmpina', 'Posești', 'Predeal-Sărari', 'Provița de Jos', 'Provița de Sus', 'Râfov', 'Sălciile', 'Sâncoale', 'Scăiosu Mare', 'Şoimari', 'Șotrile', 'Șoimari', 'Șirna', 'Ștefănești', 'Ştefăneștii de Jos', 'Ştefăneștii de Sus', 'Ştefanu', 'Şoimul', 'Scorțeni', 'Surani', 'Tâmboești', 'Tătărani', 'Tață', 'Teișani', 'Tomșani', 'Urlaţi', 'Valea Călugărească', 'Valea Dansului', 'Valea Doftanei', 'Vălcănești', 'Vârbilău', 'Vernești'],
  'SM': ['Satu Mare', 'Carei', 'Negrești-Oaș', 'Tășnad', 'Livada', 'Ardud', 'Asuaju de Sus', 'Babța', 'Bercu', 'Berveni', 'Bixad', 'Bogdand', 'Botiz', 'Călimanesti', 'Căpleni', 'Certeze', 'Cămârzan', 'Cizer', 'Craidorolț', 'Cruciș', 'Culciu', 'Doba', 'Dorolț', 'Foieni', 'Ghenci', 'Halmeu', 'Hodod', 'Lazuri', 'Mădăras', 'Medieșu Aurit', 'Micula', 'Odoreu', 'Orășu Nou', 'Păuleștii Mici', 'Petrești', 'Petru Rareș', 'Pișcolt', 'Pomi', 'Porumbești', 'Racșa', 'Răstoci', 'Sânişlău', 'Sanislău', 'Socond', 'Santău', 'Supur', 'Șamșud', 'Tiream', 'Turulung', 'Turtești', 'Urziceni', 'Valea Vinului', 'Vama', 'Vetis', 'Viile Satu Mare'],
  'SJ': ['Zalău', 'Șimleu Silvaniei', 'Jibou', 'Cehu Silvaniei', 'Șimleu Silvaniei', 'Alma', 'Băbeni', 'Bălan', 'Băbdiu', 'Boghiş', 'Bobota', 'Buciumi', 'Carastelec', 'Chieșd', 'Cizer', 'Coșeiu', 'Crăceni', 'Creaca', 'Crasna', 'Dobrin', 'Dragu', 'Fildu de Jos', 'Gîlgău', 'Gâlgău Almașului', 'Hereclean', 'Hida', 'Ileanda', 'Ip', 'Letca', 'Lozna', 'Măeriște', 'Mărgău', 'Măierului', 'Meseștenii de Jos', 'Mirsid', 'Năpradea', 'Nușfalău', 'Pericei', 'Plopi', 'Poieni', 'Răstolț', 'Romita', 'Sâg', 'Sălățig', 'Sărmășag', 'Șamșud', 'Șăucile', 'Sânmihaiu Almașului', 'Șimișna', 'Treznea', 'Valcău de Jos', 'Vârșolț', 'Zalau', 'Zimbor'],
  'SB': ['Sibiu', 'Mediaș', 'Cisnădie', 'Agnita', 'Avrig', 'Dumbrăveni', 'Copșa Mică', 'Miercurea Sibiului', 'Ocna Sibiului', 'Săliște', 'Tălmaciu', 'Alma', 'Altâna', 'Alțâna', 'Amnas', 'Apoldu de Jos', 'Arpașu de Jos', 'Arpașu de Sus', 'Axente Sever', 'Bazna', 'Băgăciu', 'Biertan', 'Blăjel', 'Boița', 'Bradu', 'Brateiu', 'Bruiu', 'Chirpăr', 'Cisnădioara', 'Cristian', 'Dăbâca', 'Dârlos', 'Gura Râului', 'Hoghilag', 'Jina', 'Laslea', 'Lichișoara', 'Loamneș', 'Ludoș', 'Mârşa', 'Moșna', 'Nocrich', 'Orlat', 'Păuca', 'Porumbacu de Jos', 'Poplaca', 'Poiana Sibiului', 'Rășinari', 'Rășinari', 'Roșia', 'Roșia', 'Sadu', 'Sălișdea', 'Șelimbăr', 'Șeica Mare', 'Șeica Mică', 'Șura Mare', 'Șura Mică', 'Slimnic', 'Tilișca', 'Turnu Roșu', 'Tilișca', 'Valea Viilor', 'Valea Lunga', 'Vurpod'],
  'SV': ['Suceava', 'Fălticeni', 'Rădăuți', 'Câmpulung Moldovenesc', 'Vatra Dornei', 'Gura Humorului', 'Solca', 'Liteni', 'Broșteni', 'Vicovu de Sus', 'Adâncata', 'Arbore', 'Bilca', 'Bosanci', 'Breaza', 'Brezna', 'Brodina', 'Burla', 'Cacica', 'Călinești', 'Cârlibaba', 'Chiril', 'Ciprian Porumbescu', 'Comănești', 'Cornu Luncii', 'Costișa', 'Crucea', 'Drăguș', 'Drăgoiești', 'Dumbrava', 'Fântâna Mare', 'Frătăuții Noi', 'Frătăuții Vechi', 'Fundu Moldovei', 'Grămești', 'Grămești', 'Grănicești', 'Hânțești', 'Horodniceni', 'Horodnic de Jos', 'Horodnic de Sus', 'Iacobeni', 'Ipotești', 'Isaccea', 'Izvoarele Sucevei', 'Jereștii', 'Jitca', 'Mălini', 'Marginea', 'Moldovița', 'Moara', 'Mitocu Dragomirnei', 'Mușenița', 'Poiana Stampei', 'Prisaca Dornei', 'Putna', 'Râșca', 'Șaru Dornei', 'Șcheia', 'Siminicea', 'Stulpicani', 'Sucevița', 'Todirești', 'Ulma', 'Vadu Moldovei', 'Valea Moldovei', 'Vama', 'Vatra Moldoviței', 'Volovat', 'Zamostea', 'Zvoriștea'],
  'TR': ['Alexandria', 'Rosiori de Vede', 'Turnu Măgurele', 'Videle', 'Zimnicea', 'Băbeni', 'Băleasa', 'Bălacea', 'Bâscov', 'Beuca', 'Bogdana', 'Bogdănești', 'Brânceni', 'Brâncoveni', 'Calomfirești', 'Călmățui', 'Ciuperceni', 'Conțești', 'Crangu', 'Crângu', 'Dăbuleni', 'Diculeștii Noi', 'Didești', 'Dolhești', 'Drăgăești-Vlașca', 'Drăgănești de Vede', 'Drăgănești-Vlașca', 'Drăgunești', 'Drăgunești', 'Frumoasa', 'Furceni', 'Găleni', 'Găneasa', 'Lița', 'Lisa', 'Lunca', 'Mărtinești', 'Moșteni', 'Nanov', 'Nenculeștii', 'Olteni', 'Peretu', 'Pietroștii de Jos', 'Planroșu', 'Purani', 'Putineiu', 'Racovu', 'Ravenești', 'Salcia', 'Sârba', 'Săceni', 'Scorbura', 'Scrapcino', 'Scrioștea', 'Segarcea-Vale', 'Serbeștii de Sus', 'Seuca', 'Sfinică', 'Ștefan Vodă', 'Ștorobănești', 'Șuțu', 'Surpeni', 'Tătărăștii de Sus', 'Tătărău', 'Tătărașcu', 'Traian', 'Țuiu', 'Uda-Clocociov', 'Unceștii', 'Vădăstrîta', 'Valea Călmătțui', 'Vedea', 'Vișina', 'Vișina Nouă', 'Vităneștii', 'Vitezeștii', 'Vițra', 'Voja', 'Zâmbreasca'],
  'TM': ['Timișoara', 'Lugoj', 'Caransebeș', 'Sânnicolau Mare', 'Jimbolia', 'Făget', 'Gătaia', 'Buziaș', 'Ciacova', 'Deta', 'Recaș', 'Sânandrei', 'Săvârșin', 'Fachini', 'Băhnei', 'Baldovin', 'Bara', 'Becicherecu Mic', 'Biled', 'Birda', 'Bogda', 'Bolvașnița', 'Brăteștii de Sus', 'Carani', 'Cenad', 'Chevereșu Mare', 'Comloșu Mare', 'Coșteiu', 'Criciova', 'Cruceni', 'Darva', 'Denta', 'Dudeștii Noi', 'Dudeștii Vechi', 'Faget', 'Fardea', 'Gavojdia', 'Ghillad', 'Ghilad', 'Ghiroda', 'Ghizela', 'Giarmata', 'Ghirale', 'Gottlob', 'Grabat', 'Grabaț', 'Iecea Mare', 'Ighisu Nou', 'Jebel', 'Lenauheim', 'Liebling', 'Livezile', 'Lovrin', 'Mănăștiur', 'Margina', 'Măsloc', 'Moșnița Nouă', 'Nitchidorf', 'Orțișoara', 'Partoș', 'Pecica', 'Peciu Nou', 'Pietroasa', 'Pișchia', 'Radna', 'Remetea Mare', 'Sacalaz', 'Sacoșu Turcesc', 'Secaș', 'Sânmihaiu Român', 'Șag', 'Șanopal', 'Săcălaz', 'Șemlacu Mare', 'Stamora Română', 'Stamora Moravița', 'Tomeștii Vechi', 'Traian Vuia', 'Tepe-Săcel', 'Uliuc', 'Unip', 'Variaș', 'Vârtoape', 'Victor Vlad Delamarina', 'Voiteg'],
  'TL': ['Tulcea', 'Măcin', 'Isaccea', 'Sulina', 'Babadag', 'Mahmudia', 'Baia', 'Beidaud', 'Casimcea', 'Ceatal-Izmail', 'Chilia Veche', 'Ciucurova', 'Crișan', 'C.A. Rosetti', 'Dăeni', 'Frecăței', 'Greci', 'Hamcearca', 'Horia', 'I.C.Brătianu', 'Jijila', 'Jurilovca', 'Luncavița', 'Maliuc', 'Mihai Bravu', 'Mihail Kogălniceanu', 'Murighiol', 'Nalbant', 'Niculițel', 'Ostrov', 'Pardina', 'Pecineaga', 'Sarichioi', 'Slava Cercheză', 'Smârdan', 'Somova', 'Topolog', 'Turcoaia', 'Valea Nucarilor', 'Văcăreni'],
  'VS': ['Vaslui', 'Bârlad', 'Huși', 'Negrești', 'Murgeni', 'Zorleni', 'Alexandru Vlahuță', 'Berezeni', 'Băceștii de Jos', 'Băldovinești', 'Banca', 'Bărani', 'Berezeni', 'Blăgești', 'Bogdănești', 'Bogdănița', 'Boțești', 'Bunești-Averești', 'Codăești', 'Coroiești', 'Costești', 'Cretești', 'Dămieniș', 'Dancu', 'Dănești', 'Delești', 'Dimitrie Cantemir', 'Dodești', 'Drânceni', 'Dumeștii de Jos', 'Epureni', 'Fălciu', 'Fruntișeni', 'Gârceni', 'Ghergești', 'Iana', 'Ibănești', 'Ivănești', 'Laza', 'Lipovăț', 'Lunca Banului', 'Mălușteni', 'Mândrești', 'Micșulești', 'Miclești', 'Muntenii de Jos', 'Oltenești', 'Osești', 'Perieni', 'Pogana', 'Pogonești', 'Poienești', 'Puiești', 'Pune', 'Răchiț', 'Roșiești', 'Săliștea', 'Șuletea', 'Solești', 'Ștefan cel Mare', 'Tăcută', 'Tanacu', 'Tudora', 'Vetrisoaia', 'Viișoara', 'Vinderei', 'Zăpodeni', 'Zăpodia'],
  'VL': ['Râmnicu Vâlcea', 'Drăgășani', 'Călimănești', 'Băile Olănești', 'Ocnele Mari', 'Băile Govora', 'Horezu', 'Bălcești', 'Bărbătești', 'Berislăvești', 'Budești', 'Bunești', 'Cernișoara', 'Copăceni', 'Costești', 'Crețeni', 'Dăeștii', 'Danicei', 'Dicani', 'Drăgoiești', 'Făurești', 'Fârțănești', 'Frâncești', 'Galicea', 'Ghiocălești', 'Ghioroiu', 'Glăvile', 'Golești', 'Ioneștii Govorii', 'Lăpu', 'Luncanii de Jos', 'Lungești', 'Măciuca', 'Măldărești', 'Mălaia', 'Mihăești', 'Milcoiu', 'Muereasca', 'Nicolae Bălcescu', 'Olanu', 'Orlești', 'Păușești', 'Păușești-Măglași', 'Peșștiș', 'Pietrarii de Jos', 'Popești', 'Prundeni', 'Racoviță', 'Racovița', 'Ranca', 'Roești', 'Româsniu', 'Rosănu', 'Roșile', 'Runcu', 'Săliște', 'Sărdănești', 'Scundu', 'Slătioara', 'Șirineasa', 'Ștefănești', 'Stoilești', 'Stoenești', 'Stroesti', 'Sutești', 'Tetoiu', 'Titești', 'Tomșani', 'Vaideeni', 'Valea Mare', 'Vlădești', 'Voicești', 'Voineasa', 'Voicesti'],
  'VN': ['Focșani', 'Adjud', 'Mărășești', 'Odobești', 'Panciu', 'Mărasesti', 'Dumbrăveni', 'Gagești', 'Golești', 'Gugești', 'Jălaia', 'Măicănești', 'Năneși', 'Nereju', 'Oancea', 'Paltin', 'Păunești', 'Ploscuțeni', 'Pufești', 'Răcoasa', 'Reghiu', 'Rugile', 'Sihlea', 'Spulber', 'Străoan', 'Șuletea', 'Tătărani', 'Tifești', 'Tulnici', 'Urechești', 'Valea Sării', 'Vârtecopu', 'Vidra', 'Vintilă Vodă', 'Vulturu', 'Vulturu', 'Ămălărești', 'Băneștii de Sus', 'Bârsești', 'Bogești', 'Bolotești', 'Broșteni', 'Cârligele', 'Ciorăști', 'Codrești', 'Corbita', 'Cotești', 'Crotești', 'Dălești', 'Dumbrava', 'Fitionești', 'Gărștii de Jos', 'Gura Caliței', 'Homocea', 'Hămărești', 'Jariștea', 'Lămărești', 'Lepșa', 'Mera', 'Milcovu', 'Mânescale', 'Movilița']
};

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

const initialFormData = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    county: '',
    country: 'România',
    taxNumber: '',
    registrationNumber: '',
    status: 'ACTIVE' as SupplierStatus,
    paymentTerms: '30 zile',
    deliveryTime: 5,
    notes: '',
};

export default function SupplierFormModal({
  isOpen,
  onClose,
  supplier,
  onSuccess,
}: SupplierFormModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [loadingAddressSuggestions, setLoadingAddressSuggestions] = useState(false);
  const toast = useToast();
  const supplyService = new SupplyService();

  // Orașe disponibile bazate pe județul selectat
  const availableCities = formData.county ? CITIES_BY_COUNTY[formData.county] || [] : [];

  // Funcție pentru căutarea adreselor
  const fetchAddressSuggestions = useCallback(
    debounce(async (input: string) => {
      if (!input || input.length < 3) return;

      // Construiește query cu restricțiile de județ și oraș
      let searchQuery = input;
      if (formData.county) {
        const countyName = ROMANIAN_COUNTIES.find(c => c.code === formData.county)?.name;
        if (countyName) {
          searchQuery += `, ${countyName}`;
        }
      }
      if (formData.city) {
        searchQuery += `, ${formData.city}`;
      }
      searchQuery += ', Romania';

      try {
        setLoadingAddressSuggestions(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery
          )}&format=json&addressdetails=1&countrycodes=ro&limit=5`,
          {
            headers: {
              'Accept-Language': 'ro'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setAddressSuggestions(data);
        setShowAddressSuggestions(true);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        toast({
          title: 'Eroare',
          description: 'Nu s-au putut încărca sugestiile de adrese.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingAddressSuggestions(false);
      }
    }, 300),
    [formData.county, formData.city, toast]
  );

  // Auto-detect county and city from address
  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    const displayName = suggestion.display_name;
    handleChange('address', displayName);
    
    // Încearcă să detecteze județul și orașul din adresă
    const address = suggestion.address;
    if (address) {
      // Detectează județul
      if (address.state || address.county) {
        const detectedCounty = address.state || address.county;
        const matchingCounty = ROMANIAN_COUNTIES.find(c => 
          c.name.toLowerCase().includes(detectedCounty!.toLowerCase()) ||
          detectedCounty!.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchingCounty && !formData.county) {
          handleChange('county', matchingCounty.code);
        }
      }

      // Detectează orașul
      if (address.city || address.town || address.village) {
        const detectedCity = address.city || address.town || address.village;
        if (detectedCity && !formData.city) {
          handleChange('city', detectedCity);
        }
      }
    }
    
    setShowAddressSuggestions(false);
  };

  const handleCountyChange = (countyCode: string) => {
    handleChange('county', countyCode);
    // Reset city when county changes
    if (formData.city) {
      handleChange('city', '');
    }
  };

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name,
        contactPerson: supplier.contact_person || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
        city: supplier.city || '',
        county: supplier.county || '', // Assuming supplier has county
        country: supplier.country || 'România',
        taxNumber: supplier.tax_number || '',
        registrationNumber: supplier.registration_number || '',
        status: supplier.status,
        paymentTerms: supplier.payment_terms || '30 zile',
        deliveryTime: supplier.delivery_time || 5,
                notes: supplier.notes || '',
            });
        } else {
            setFormData(initialFormData);
        }
    setErrors({});
  }, [supplier, isOpen]);

  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Romanian phone patterns: 0752-123-456, +40752123456, 0252-123-456, etc.
    const phonePattern = /^(\+4|4|0)([23][0-9]{8}|7[0-9]{8})$/;
    const cleanPhone = phone.replace(/[\s\-\.]/g, ''); // Remove spaces, dashes, dots
    return phonePattern.test(cleanPhone);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Numele furnizorului este obligatoriu';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Numele trebuie să aibă cel puțin 2 caractere';
    }

    // Contact person validation
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Persoana de contact este obligatorie';
    } else if (formData.contactPerson.length < 2) {
      newErrors.contactPerson = 'Numele persoanei de contact trebuie să aibă cel puțin 2 caractere';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email-ul este obligatoriu';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email-ul nu este valid (ex: contact@furnizor.ro)';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefonul este obligatoriu';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Numărul de telefon nu este valid (ex: 0252-123-456, 0752-123-456)';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Adresa este obligatorie';
    } else if (formData.address.length < 5) {
      newErrors.address = 'Adresa trebuie să aibă cel puțin 5 caractere';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'Orașul este obligatoriu';
    }

    // Tax number validation
    if (!formData.taxNumber.trim()) {
      newErrors.taxNumber = 'Codul fiscal este obligatoriu';
    } else if (!/^RO[0-9]{8,10}$/.test(formData.taxNumber.replace(/\s/g, ''))) {
      newErrors.taxNumber = 'Codul fiscal trebuie să fie în format RO12345678';
    }

    // Registration number validation
    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Numărul de înregistrare este obligatoriu';
    } else if (!/^J[0-9]{2}\/[0-9]{1,4}\/[0-9]{4}$/.test(formData.registrationNumber)) {
      newErrors.registrationNumber = 'Numărul de înregistrare trebuie să fie în format J16/123/2020';
    }

    // Delivery time validation
    if (formData.deliveryTime <= 0 || formData.deliveryTime > 365) {
      newErrors.deliveryTime = 'Timpul de livrare trebuie să fie între 1 și 365 zile';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
                toast({
        title: 'Eroare de validare',
        description: 'Vă rugăm să completați toate câmpurile obligatorii corect.',
                    status: 'error',
        duration: 5000,
                    isClosable: true,
                });
                return;
            }

    try {
      setLoading(true);
      
      const supplierData = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        county: formData.county, // Ensure county is included
        country: formData.country,
        taxNumber: formData.taxNumber,
        registrationNumber: formData.registrationNumber,
        status: formData.status,
        paymentTerms: formData.paymentTerms,
        deliveryTime: formData.deliveryTime,
        notes: formData.notes,
      };

            if (supplier) {
        await supplyService.updateSupplier(supplier.id, supplierData);
            } else {
        await supplyService.createSupplier(supplierData);
      }

                toast({
                    title: 'Succes',
        description: supplier
          ? 'Furnizorul a fost actualizat cu succes'
          : 'Furnizorul a fost adăugat cu succes',
                    status: 'success',
        duration: 5000,
                    isClosable: true,
                });

            onSuccess();
            onClose();
    } catch (error: any) {
            console.error('Error saving supplier:', error);
            toast({
                title: 'Eroare',
        description: error.response?.data?.message || 'Nu s-a putut salva furnizorul. Vă rugăm să încercați din nou.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

  const handleChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    // Șterge eroarea pentru câmpul modificat
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
    };

    return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent borderRadius="xl">
                <ModalHeader>
          <HStack>
            <Icon as={FiUser} />
            <Text>{supplier ? 'Editare Furnizor' : 'Adăugare Furnizor Nou'}</Text>
          </HStack>
                </ModalHeader>

                <ModalBody>
          <VStack spacing={6}>
            {/* Informații de bază */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Informații de Bază
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>Nume Furnizor</FormLabel>
                            <Input
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="ex: MedSupply SRL"
                            />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                        </FormControl>

                <FormControl isInvalid={!!errors.contactPerson}>
                            <FormLabel>Persoană Contact</FormLabel>
                            <Input
                                value={formData.contactPerson}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                    placeholder="ex: Ana Popescu"
                            />
                  <FormErrorMessage>{errors.contactPerson}</FormErrorMessage>
                        </FormControl>

                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>
                    <HStack>
                      <Icon as={FiMail} />
                      <Text>Email</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="ex: contact@furnizor.ro"
                    size="lg"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.phone}>
                  <FormLabel>
                    <HStack>
                      <Icon as={FiPhone} />
                      <Text>Telefon</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="ex: 0252-123-456 sau 0752-123-456"
                    size="lg"
                  />
                  <FormErrorMessage>{errors.phone}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Adresă */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Adresă
              </Text>
              <VStack spacing={4}>
                {/* Țară, Județ, Oraș */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Țară</FormLabel>
                    <Select
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      size="lg"
                    >
                      <option value="România">România</option>
                      <option value="Bulgaria">Bulgaria</option>
                      <option value="Serbia">Serbia</option>
                      <option value="Ungaria">Ungaria</option>
                    </Select>
                  </FormControl>

                  <FormControl isInvalid={!!errors.county}>
                    <FormLabel>Județ</FormLabel>
                    <Select
                      placeholder="Selectează județul"
                      value={formData.county}
                      onChange={(e) => handleCountyChange(e.target.value)}
                      size="lg"
                      isDisabled={formData.country !== 'România'}
                    >
                      {ROMANIAN_COUNTIES.map((county) => (
                        <option key={county.code} value={county.code}>
                          {county.name}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.county}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.city}>
                    <FormLabel>Oraș</FormLabel>
                    <Select
                      placeholder="Selectează orașul"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      size="lg"
                      isDisabled={!formData.county || availableCities.length === 0}
                    >
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.city}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                {/* Adresa cu autocomplete */}
                <FormControl isInvalid={!!errors.address} position="relative">
                  <FormLabel>
                    <HStack>
                      <Icon as={FiMapPin} />
                      <Text>Adresă Completă</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    value={formData.address}
                    onChange={(e) => {
                      handleChange('address', e.target.value);
                      if (e.target.value.length >= 3) {
                        fetchAddressSuggestions(e.target.value);
                      } else {
                        setShowAddressSuggestions(false);
                      }
                    }}
                    placeholder="ex: Str. Medicală nr. 15"
                    size="lg"
                  />
                  <FormErrorMessage>{errors.address}</FormErrorMessage>
                  
                  {/* Suggestions dropdown */}
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <Box
                      position="absolute"
                      top="100%"
                      left={0}
                      right={0}
                      zIndex={1000}
                      bg="white"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="md"
                      shadow="xl"
                      maxH="200px"
                      overflowY="auto"
                      mt={1}
                    >
                      {addressSuggestions.map((suggestion) => (
                        <Box
                          key={suggestion.place_id}
                          p={3}
                          cursor="pointer"
                          color="gray.800"
                          bg="white"
                          _hover={{ 
                            bg: "blue.50", 
                            color: "blue.800",
                            borderLeft: "3px solid",
                            borderLeftColor: "blue.500"
                          }}
                          onClick={() => handleAddressSelect(suggestion)}
                          borderBottom="1px solid"
                          borderColor="gray.200"
                          transition="all 0.2s"
                          _last={{ borderBottom: "none" }}
                        >
                          <HStack>
                            <Icon as={FiMapPin} color="blue.500" />
                            <VStack align="start" spacing={0} flex={1}>
                              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                {suggestion.display_name.split(',')[0]}
                              </Text>
                              <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                {suggestion.display_name}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {loadingAddressSuggestions && (
                    <Box position="absolute" right={3} top="50%" transform="translateY(-50%)">
                      <Spinner size="sm" />
                    </Box>
                  )}
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Informații legale */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Informații Legale
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.taxNumber}>
                  <FormLabel>
                    <HStack>
                      <Icon as={FiFileText} />
                      <Text>Cod Fiscal</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    value={formData.taxNumber}
                    onChange={(e) => handleChange('taxNumber', e.target.value.toUpperCase())}
                    placeholder="ex: RO12345678"
                    size="lg"
                  />
                  <FormErrorMessage>{errors.taxNumber}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.registrationNumber}>
                  <FormLabel>
                    <HStack>
                      <Icon as={FiHome} />
                      <Text>Număr Înregistrare</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value.toUpperCase())}
                    placeholder="ex: J16/123/2020"
                    size="lg"
                  />
                  <FormErrorMessage>{errors.registrationNumber}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Condiții comerciale */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Condiții Comerciale
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value as SupplierStatus)}
                  >
                    <option value="ACTIVE">Activ</option>
                    <option value="INACTIVE">Inactiv</option>
                    <option value="PENDING">În așteptare</option>
                  </Select>
                        </FormControl>

                        <FormControl>
                  <FormLabel>Termeni de Plată</FormLabel>
                  <Select
                    value={formData.paymentTerms}
                    onChange={(e) => handleChange('paymentTerms', e.target.value)}
                  >
                    <option value="15 zile">15 zile</option>
                    <option value="30 zile">30 zile</option>
                    <option value="45 zile">45 zile</option>
                    <option value="60 zile">60 zile</option>
                    <option value="90 zile">90 zile</option>
                  </Select>
                        </FormControl>

                <FormControl isInvalid={!!errors.deliveryTime}>
                  <FormLabel>Timp Livrare (zile)</FormLabel>
                  <NumberInput
                    value={formData.deliveryTime}
                    onChange={(_, value) => handleChange('deliveryTime', value)}
                    min={1}
                    max={365}
                  >
                    <NumberInputField placeholder="ex: 5" />
                  </NumberInput>
                  <FormErrorMessage>{errors.deliveryTime}</FormErrorMessage>
                        </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Observații */}
            <Box w="full">
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Observații
              </Text>
                        <FormControl>
                <FormLabel>Observații Generale</FormLabel>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Introduceți observații despre furnizor..."
                  rows={4}
                            />
                        </FormControl>
            </Box>
                    </VStack>
                </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>
                        Anulează
                    </Button>
                    <Button
            colorScheme="brand"
                        onClick={handleSubmit}
                        isLoading={loading}
            loadingText="Se salvează..."
                    >
            {supplier ? 'Salvează Modificările' : 'Adaugă Furnizor'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 