const axios = require('axios');

function searchResultHTML(stores) {
    return stores.map(store=> {
        return `
            <a href='/store/${store.slug}' class="search_result">
                <strong>${store.name}</strong>
                <p>${store.description}</p>
            </a>
        `
    }).join('');   
}

function typeAhead(search) {
    // console.log(search);
    if(!search) return;
    const inputSearch = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    // console.log(inputSearch, searchResults);

    inputSearch.on('input', function(){
        if(!this.value) {
            searchResults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';
        searchResults.innerHTML = ' '

        axios
            .get(`/api/search?q=${this.value}`)
            .then(res => {
                // console.log(res.data);
                if(res.data.length) {
                    const html = searchResultHTML(res.data);
                    searchResults.innerHTML = html;
                }
            })
            .catch(err=>{
                console.log(err);
            });        
    });

    //handle keyboar inputs

    inputSearch.on('keyup', (e)=>{
        if(![38,40,13].includes(e.keycode)){
            return;
        }
        
    })

}

export default typeAhead;