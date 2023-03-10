import keys from "../components/keys"
import { useSearchParams } from "react-router-dom"

const Home = () => {

    const [searchParams] = useSearchParams()

    const generateCodeChallenge = async codeVerifier => {
        const digest = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(codeVerifier),
        );
    
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
    }

    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    const generateRandomString = length => {
        let text = ''
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length))
        }
        return text
    }

    const redirect = () => {
        if (localStorage.getItem('access_token')) {
            window.location.replace('/results')
            return
        }
        let logoff = searchParams.get('log_off')
        let state = generateRandomString(16)
        let scope = 'user-read-private user-read-email user-top-read user-modify-playback-state'
        let code_verifier = generateRandomString(64)
        localStorage.setItem('code_verifier', code_verifier)
        generateCodeChallenge(code_verifier).then((code_challenge) => {
        window.location.replace('https://accounts.spotify.com/authorize?' + 
            new URLSearchParams({
                response_type: 'code',
                client_id: keys.client_id,
                scope,
                redirect_uri: keys.redirect_uri,
                state,
                show_dialog: logoff ? logoff : false,
                code_challenge_method: 'S256',
                code_challenge
            }
        ).toString())})
    }

    return (
        <div id='homeMain'>
            <h3>Spotify Top Track Lister</h3>
            <div id="home">
                <p>
                    This application gets your top tracks from Spotify and lists the first 50.
                    You can click on the song title, album, or any of the artists to go to the Spotify page for it.
                    You can even queue your favorite song right from the website!
                </p>
            </div>
            <button className='btn btn-outline-success' onClick={() => redirect()}>Log in</button>
        </div>
    )
}

export default Home
