


import spotifyApi from "spotify-web-api-node";

import axios from "axios";
function SpotifyCall(req,res){
    console.log(req.body);
        const code =req.body.code;
        console.log(code);
        var credentials = {
          // old one : c6b512eb13d348b0bf6afb8767335835
          // new one : 558f508525964bb5ae308695a37358a5
          // new secret : b58484a2a62e40a98773469ed68ba03c
          // old secret : 283770fbfcfa498497e01341b79ea01c
            clientId: '558f508525964bb5ae308695a37358a5',
            clientSecret: 'b58484a2a62e40a98773469ed68ba03c',
            redirectUri: 'http://localhost:3000/login'
          };
          
        //   {
        //     redirectUri:"http://localhost:3000",
        //     clientId:"c6b512eb13d348b0bf6afb8767335835",
        //     clientSecret:"283770fbfcfa498497e01341b79ea01c",
        // }
        const spotifyapi=new spotifyApi(credentials);
        
     
        spotifyapi.authorizationCodeGrant(code).then(
            function(data) {
              console.log('The token expires in ' + data.body['expires_in']);
              console.log('The access token is ' + data.body['access_token']);
              console.log('The refresh token is ' + data.body['refresh_token']);
                          res.json({
                access_token:data.body.access_token,
                refreshToken:data.body.refresh_token,
                expiresIn:data.body.expires_in
            })
              // Set the access token on the API object to use it in later calls
            //   spotifyApi.setAccessToken(data.body['access_token']);
            //   spotifyApi.setRefreshToken(data.body['refresh_token']);
            },
            function(err) {
              console.log('Something went wrong!', err);
              res.status(400).json({mess:err?.message})
            }
          );
}



const getArtists = async (accessToken) => {
    var  offset = 0, limit = 50;
    console.log("getartists",typeof(accessToken));
    try{
        const response = await axios.get('https://api.spotify.com/v1/artists', {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
      },
      params: {
        limit: limit,
        offset: offset,
      },
    });
    console.log(response);
    return "ok"
    // return response.data.artists.items;
    }
    catch(e){
        console.log(e);
        return e
    }
    // return "data";
  };
  


export {SpotifyCall,getArtists}