import axios from 'axios';
import { $} from  './bling';
import autocomplete from './autocomplete';

const mapOtions = {
    center: { lat:28.4, lng: 77.5},
    zoom:5
}

function loadPlaces(map,lat = 28.4,lng = 77.5){
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
        .then(res => {
            const places = res.data;
            // console.log(places);
            if(!places.length) {
                alert('Opps!! No Restrro Found...');
                return;
            }

            //Creating a bond
            const bounds = new google.maps.LatLngBounds();
            const infoWindows = new google.maps.InfoWindow()

            const markers = places.map(place => {
                const [placeLng, placeLat] = place.location.coordinates;
                // console.log(placeLng, placeLat);
                const position = { lat: placeLat, lng:placeLng};
                bounds.extend(position);
                const marker = new google.maps.Marker({map,position})
                marker.place = place;
                return marker;
            });

            markers.forEach(marker => marker.addListener('click', function() {
                // console.log(th???is);
                const html = `
                    <div class="popup">
                        <a href="/store/${this.place.slug}">
                            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}"/>
                            <p>${this.place.name} - ${this.place.location.address}</p>
                        </a>                    
                    </div>
                `;
                infoWindows.setContent(html);
                infoWindows.open(map,this);
            }));
            // console.log(markers);
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds)
        });

}

function makeMap(mapDiv) {
    if(!mapDiv)return;

    //Make Map

    const map = new google.maps.Map(mapDiv, mapOtions); 
    loadPlaces(map);
    const input = $('[name="geolocate"]');
    // console.log(input);
    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
      });
}

export default makeMap;

