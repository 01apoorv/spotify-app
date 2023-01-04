import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import keys from '../components/keys'

const Results = () => {
    const [searchParams] = useSearchParams()
    const [data, setData] = useState({'items': []})

    const buttonClick = () => {
        localStorage.clear()
        window.location.replace('/?' + new URLSearchParams({
            log_off: true
        }).toString())
    }

    const refresh = async () => {
        console.log('token refreshed')
        let authOptions = {
            method: 'POST',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: localStorage.getItem('refresh_token'),
                client_id: keys.client_id
            })
        }
        let resp = await fetch('https://accounts.spotify.com/api/token', authOptions)
        if (!resp.ok) {
            buttonClick()
            return null
        }
        let body = await resp.json()
        localStorage.setItem('access_token', body.access_token)
        if ('refresh_token' in body) localStorage.setItem('refresh_token', body.refresh_token)
        return body.access_token
    }
    
    useEffect(() => {
        const getData = async () => {
            console.log('main run')
            let access_token = localStorage.getItem('access_token')
            if (!access_token) {
                console.log('new token requested')
                let code = searchParams.get('code')
                let state = searchParams.get('state')
                let authOptions = {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: keys.redirect_uri,
                        client_id: keys.client_id,
                        code_verifier: localStorage.getItem('code_verifier')
                    })
                }
                let resp = await fetch('https://accounts.spotify.com/api/token', authOptions)
                let body = await resp.json()
                localStorage.setItem('refresh_token', body.refresh_token)
                access_token = body.access_token
                localStorage.setItem('access_token', access_token)
            }
            let dataPromise = await fetch('https://api.spotify.com/v1/me/top/tracks', {
                headers: {
                  'Authorization': 'Bearer ' + access_token
                }
            })
            if (dataPromise.status === 401) {
                access_token = await refresh()
                dataPromise = await fetch('https://api.spotify.com/v1/me/top/tracks', {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                })
            }
            let dataBody = await dataPromise.json()
            setData(dataBody)
        }
        getData().catch(() => {
            console.log('err')
        })
    }, [])

    // useEffect(() => {
    //     
    //         let dataPromise = await fetch('https://api.spotify.com/v1/me/top/tracks', {
    //             headers: {
    //               'Authorization': 'Bearer ' + body.access_token
    //             }
    //         })
    //         let dataBody = await dataPromise.json()
    //         setData(dataBody)
    //     }
    //     if (!localStorage.getItem('refresh_token')) {
    //         console.log('refresh not run')
    //         return
    //     }
    //     refresh().catch(() => {
    //         console.log('err')
    //     })
    // }, [])
    console.log(data.items)
    return (
        <div style={{padding: "25px"}}>
            <button onClick={() => buttonClick()}>Log off</button>
            {data['items'].map((item, idx) => (
                <div key={idx} className="card border border-primary" style={{marginBottom: "25px"}}>
                    <div className="card-body">
                        <h5 className="card-title">{item.name}</h5>
                        <h6 className="card-subtitle mb-2 text-muted">{item.album.name}<br></br>Released on {item.album.release_date}</h6>
                        {item.artists.map((artist, artistIdx) => (
                            <p key={artistIdx} className="card-text">{artist.name}</p>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Results
