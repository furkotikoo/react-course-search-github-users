import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

// Provider, Consumer -GithubContext.Provider, -GithubContext.Consumer

const GithubProvider = ({ children }) => {
    const [githubUser, setGithubUser] = useState(mockUser);
    const [repos, setRepos] = useState(mockRepos);
    const [followers, setFollowers] = useState(mockFollowers);

    // request laoding
    const [requests, setRequests] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // errors
    const [error, setError] = useState({ show: false, msg: "" });

    // check rate
    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                let { rate: { remaining } } = data;
                setRequests(remaining);
                if (remaining === 0) {
                    //throw an error
                    toggleError(true, 'sory you have exeeded your hourly rate limit!')
                }
            })
            .catch((err) => { console.log(err) })
    };

    // error
    const toggleError = (show = false, msg = '') => {
        setError({ show, msg });
    }

    const searchGithubUser = async (user) => {
        // toogleError
        toggleError();
        setIsLoading(true);
        const response = await axios.get(`${rootUrl}/users/${user}`)
            .catch((err) => { console.log(err) })
        if (response) {
            setGithubUser(response.data);
            const { login, followers_url } = response.data;

            await Promise.allSettled([axios.get(`${rootUrl}/users/${login}/repos?per_page=100`), axios.get(`${followers_url}?per_page=100`)])
                .then((results) => {
                    const [repso, followers] = results;
                    const status = 'fullfilled';

                    if (repos.status === status) {
                        setRepos(repos.value);
                    }

                    if (followers.status === status) {
                        setFollowers(followers.value);
                    }
                }).catch((err) => { console.log(err) });
        } else {
            toggleError(true, 'There is no user with that username');
        }
        checkRequests();
        setIsLoading(false);
    }

    useEffect(checkRequests, []);


    return <GithubContext.Provider value={{ githubUser, repos, followers, requests, error, searchGithubUser, isLoading }}>{children}</GithubContext.Provider>
};

export { GithubProvider, GithubContext };
