"use client";
import {ClientServicesRouteError}from"@atlas/ui";export default function ClientServicesError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <ClientServicesRouteError reset={reset}/>}
