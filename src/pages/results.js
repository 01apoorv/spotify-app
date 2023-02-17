import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import keys from '../components/keys'

const Results = () => {
    const [searchParams] = useSearchParams()
    const [data, setData] = useState({'items': []})
    const [list, setList] = useState('short_term')
    const [active, setActive] = useState(0)
    const [show, setShow] = useState(false)

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
            let dataPromise = await fetch('https://api.spotify.com/v1/me/top/tracks?' + new URLSearchParams({
                    limit: 50,
                    time_range: list
                }).toString(), {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                })
            let userProfile = await fetch('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': 'Bearer ' + access_token
                }
            })
            if (dataPromise.status === 401) {
                access_token = await refresh()
                dataPromise = await fetch('https://api.spotify.com/v1/me/top/tracks?' + new URLSearchParams({
                    limit: 50,
                    time_range: list
                }).toString(), {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                })
                userProfile = await fetch('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                })
            }
            let dataBody = await dataPromise.json()
            let userBody = await userProfile.json()
            if (userBody.id === 'dgeorgie0407') setShow(true)
            else if (show) setShow(false)
            setData(dataBody)
        }
        getData().catch(() => {
            console.log('err')
        })
    }, [list])

    const queueSong = async uri => {
        let access_token = localStorage.getItem('access_token')
        await fetch('https://api.spotify.com/v1/me/player/queue?' + new URLSearchParams({
            uri
        }).toString(), {
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            method: 'POST'
        })
    }

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
    // console.log(data.items)
    return (
        <div>
            <nav className="navbar navbar-expand-md navbar-light bg-light fixed-top justify-content-center">
                <div className='navbar-collapse collapse'>
                    <div className="btn-group btn-group-toggle" data-toggle="buttons">
                        <button onClick={() => {setList('short_term'); setActive(0)}} className={(active === 0 ? "btn btn-outline-success active" : "btn btn-outline-success")+' buttonMargin'}>Last 4 weeks</button>
                        <button onClick={() => {setList('medium_term'); setActive(1)}} className={active === 1 ? "btn btn-outline-success active" : "btn btn-outline-success"}>Last 6 months</button>
                        <button onClick={() => {setList('long_term'); setActive(2)}} className={active === 2 ? "btn btn-outline-success active" : "btn btn-outline-success"}>All time</button>
                    </div>
                </div>
                <div className="navbar-nav ml-auto">
                    <button onClick={() => buttonClick()} className="btn btn-outline-primary lastButton">Log off</button>
                </div>
            </nav>
            <div style={{padding: "25px", marginTop: '50px'}}>
                <div>
                    {show ? <p className='message'>Hi Rachel :)</p> : ''}
                </div>
                {data['items'].map((item, idx) => (
                    <div key={idx} className="card border border-primary" style={{marginBottom: "25px"}}>
                        <div className="card-body">
                            <div className='row'>
                                <div className='col'>
                                    <div className='songTitle'>
                                        <h5><a href={item.external_urls.spotify} className='link-dark' target='_blank' rel='noreferrer'>{item.name}</a></h5>
                                        <button onClick={() => queueSong(item.uri)} className='btn btn-outline-primary btn-sm buttonMargin'>Queue song</button>
                                    </div>
                                    <h6 className="card-subtitle mb-2 text-muted">
                                        <a href={item.album.external_urls.spotify} className="link-secondary" target='_blank' rel='noreferrer'>{item.album.name}</a>
                                    <br></br>
                                    Released on {item.album.release_date}</h6>
                                    <h6 className='card-title'>Artists:</h6>
                                    {item.artists.map((artist, artistIdx) => (
                                        <p key={artistIdx} className="pclass"><a href={artist.external_urls.spotify} className="link-secondary" target='_blank' rel='noreferrer'>{artist.name}</a></p>
                                    ))}
                                </div>
                                <div className='col' style={{textAlign: 'right'}}>
                                    <img src={item.album.images[1].url} alt={item.album.name} width={item.album.images[1].width} height={item.album.images[1].height}></img>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Results
