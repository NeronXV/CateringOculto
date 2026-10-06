// Local Mexican numbers are accepted by forms; wa.me requires the country code.
export function whatsAppDigits(phone:string){const digits=phone.replace(/\D/g,'');return digits.length===10?'52'+digits:digits;}
