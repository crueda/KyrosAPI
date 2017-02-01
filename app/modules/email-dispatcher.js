
var EM = {};
module.exports = EM;

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var PropertiesReader = require('properties-reader');

var properties = PropertiesReader('kyrosapi.properties');

EM.dispatchResetPasswordLink = function(account, callback)
{
    var nodemailer = require('nodemailer');

    /*var transporter = nodemailer.createTransport({
        service: 'Gmail',
        secureConnection: true,
        auth: {
            user: properties.get('mail.user'),
            pass: properties.get('mail.pass')
        }
    });*/

    var transporter = nodemailer.createTransport(smtpTransport({
        host: properties.get('mail.account.host'),
        port: 25,
        auth: {
            user: properties.get('mail.account.user'),
            pass: properties.get('mail.account.password')
        }
    }));
    

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Kyros LBS" <logistica@kyroslbs.com>', 
        to: account.email, 
        subject: 'KyrosView - proceso para recuperación de contraseña', 
        html: EM.composeHtmlEmail(account),
        text: EM.composeTextEmail(account)
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            transporter.close();
            console.log("error:" + error);
            callback (error, null);
        } 
        else {
            transporter.close();
            //console.log('Message sent: ' + info.response);
            callback (null, account);            
        }
    });


}

EM.dispatchShareVehicleLink = function(shareData, callback)
{
    var nodemailer = require('nodemailer');

    var transporter = nodemailer.createTransport(smtpTransport({
        host: properties.get('mail.account.host'),
        port: 25,
        auth: {
            user: properties.get('mail.account.user'),
            pass: properties.get('mail.account.password')
        }
    }));
    
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Kyros LBS" <logistica@kyroslbs.com>', 
        to: shareData.email, 
        subject: 'KyrosView - seguimiento de vehículo', 
        html: EM.composeShareVehicleHtmlEmail(shareData.username, shareData.vehicle_license, shareData.uuid),
        text: EM.composeShareVehicleTextEmail(shareData.username, shareData.vehicle_license, shareData.uuid)
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            transporter.close();
            console.log("error:" + error);
            callback (error, null);
        } 
        else {
            transporter.close();
            //console.log('Message sent: ' + info.response);
            callback (null, "ok");            
        }
    });


}

EM.composeHtmlEmail = function(o)
{
    var link = 'http://view.kyroslbs.com/reset-password?u='+o.user+'&h='+o.uuid;
    var html = "<html><body>";
        html += "Hola "+o.name+",<br><br>";
        html += "Tu nombre de usuario en Kyros es <b>"+o.user+"</b> y has solicitado resetar tu contraseña.<br><br>";
        html += "Haga click en el siguiente <a href='"+link+"'>enlace</a> para continuar con el proceso.<br><br>";
        html += "Hasta pronto!,<br>";
        html += "<a href='http://www.kyroslbs.com'>Kyros LBS Team</a><br><br>";
        html += "</body></html>";
    return  html;
}

EM.composeTextEmail = function(o)
{
    var link = 'http://localhost:3000/reset-password?u='+o.user+'&h='+o.uuid;
    var html = "<html><body>";
        html += "Hola "+o.name+",";
        html += "Tu nombre de usuario en Kyros es: "+o.user+" y has solicitado resetar tu contraseña.";
        html += "Abra el siguiente enlace en su navegador para continuar con el proceso: "+link;
        html += "Hasta pronto!";
        html += "Kyros LBS Team";
    //return  [{data:html, alternative:true}];
    return  html;
}

EM.composeShareVehicleHtmlEmail = function(username, vehicleLicense, uuid)
{
    var link = 'http://view.kyroslbs.com/follow.html?uuid='+uuid;
    var html = "<html><body>";
        html += "Hola !<br><br>";
        html += "El usuario de Kyros <b>"+username+"</b> desea compartir contigo la localización del vehículo <b>"+vehicleLicense+"</b>.<br><br>";
        html += "Haga click en el siguiente <a href='"+link+"'>enlace</a> para seguir su posición en tiempo real.<br>";
        html += "Este enlace tienen una validez de 24 horas.<br><br>";
        html += "Hasta pronto!,<br>";
        html += "<a href='http://www.kyroslbs.com'>Kyros LBS Team</a><br><br>";
        html += "</body></html>";
    return  html;
}

EM.composeShareVehicleTextEmail = function(username, vehicleLicense, uuid)
{
    var link = 'http://view.kyroslbs.com/follow.html?uuid='+uuid;
    var html = "<html><body>";
        html += "Hola !<br><br>";
        html += "El usuario de Kyros <b>"+username+"</b> desea compartir contigo la localización del vehículo <b>"+vehicleLicense+"</b>.<br><br>";
        html += "Haga click en el siguiente <a href='"+link+"'>enlace</a> para seguir su posición en tiempo real.<br>";
        html += "Este enlace tienen una validez de 24 horas.<br><br>";
        html += "Hasta pronto!,<br>";
        html += "<a href='http://www.kyroslbs.com'>Kyros LBS Team</a><br><br>";
        html += "</body></html>";
    return  html;
}