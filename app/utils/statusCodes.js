function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

/**
 * This response code only occurs when using the HTTP proxy. It is issued by
 * the proxy servlet when the attempt to contact the target server results
 * in a Java SocketException. This response probably indicates that the
 * target server is currently down.
 */
define("STATUS_CONNECTION_RESET_ERROR", -92);

/**
 * Indicates a generic failure on the server. See the error handling section
 * in {@link com.smartgwt.client.rpc.RPCManager RPCManager documentation}
 * for more information.
 */
define("STATUS_FAILURE", -1);

/**
 * Indicates that the RPC has been intercepted by an authenticator that
 * requires the user to log in.
 */
define("STATUS_LOGIN_INCORRECT", -5);

/**
 * Indicates that a login is required before this RPCRequest can proceed.
 * <P>
 * Applications do not directly set this status code, instead, to trigger
 * the relogin flow, return the loginRequiredMarker in the response sent by
 * your server when login is required. See the
 * {@link com.smartgwt.client.docs.Relogin Relogin Overview} for details.
 */
define("STATUS_LOGIN_REQUIRED", -7);

/**
 * Indicates that the login succeeded.
 */
define("STATUS_LOGIN_SUCCESS", -8);

/**
 * Indicates that uploaded file exceeded max file size allowed.
 */
define("STATUS_MAX_FILE_SIZE_EXCEEDED", -11);

/**
 * Indicates that too many authentication attempts have been made and the
 * server refuses to accept any more login attempts.
 */
define("STATUS_MAX_LOGIN_ATTEMPTS_EXCEEDED", -6);

/**
 * Indicates that the total size of the data sent to the server was more
 * than the server is configured to allow. Most servers limit the post size
 * to prevent out of memory style attack vectors that push a bunch of data
 * at the server. Apache Tomcat, for example, is pre-configured to limit
 * post size to 2mb.
 * <P>
 * On internal networks, these limits can typically be safely raised or
 * removed. With Tomcat, for example, you can remove the post limit by
 * specifying the following attribute on the &lt;Connector&gt; element in
 * conf/server.xml: <br>
 *
 * <pre>
 * maxPostSize = &quot;-1&quot;
 * </pre>
 * <p>
 * <b>NOTE</b>: this status code is used whenever the server framework
 * receives a request where the POST data has been removed, however, there
 * are other possible causes, including:
 * <ul>
 * <li>security software installed on the server or network that erroneously
 * detects some kind of exploit attempt, if its behavior is to just strip
 * the POST data but allow the rest of the request through (SiteMinder is
 * one product known to do this)
 * <li>incorrectly written filter servlets that drop POST'd data
 * </ul>
 */
define("STATUS_MAX_POST_SIZE_EXCEEDED", -12);

/**
 * Indicates that the browser is currently offline, and that we do not hold
 * a cached response for the request.
 */
define("STATUS_OFFLINE", -1);

/**
 * Indicates a request timed out with no server response.
 * <p>
 * This is a client-only error code - never sent by the server (since it's
 * the server that times out).
 * <p>
 * NOTE that if using <code>hiddenFrame</code> as the transport (not the
 * default), a malformed response such as a "500 Server Error" or 404 errors
 * will be reported as a timeout.
 */
define("STATUS_SERVER_TIMEOUT", -100);

/**
 * Indicates successful completion of the request. This is the default
 * status and is automatically used by the RPCResponse on the server unless
 * you override it with setStatus(). <br>
 * <br>
 * See the error handling section in
 * {@link com.smartgwt.client.rpc.RPCManager RPCManager documentation} for
 * more information.
 */
define("STATUS_SUCCESS", 0);

/**
 * Indicates that the request was either never attempted or was rolled back,
 * because automatic or user transactions are in force and another request
 * in the same transaction failed. Note that the request(s) that actually
 * failed will have a code specific to the failure; it is only the requests
 * that would otherwise have succeeded that are marked with this failure
 * code.
 */
define("STATUS_TRANSACTION_FAILED", -10);

/**
 * This response code is usable only with the XMLHttpRequest transport and
 * indicates that the server returned an HTTP response code outside the
 * range 200-299 (all of these statuses indicate success, but ordinarily
 * only 200 is used). To get the actual response code, you can query
 * rpcResponse.httpResponseCode in your callback.
 * <p>
 * Note that currently this error code will never occur for the
 * <code>hiddenFrame</code> transport - instead, use
 * {@link com.smartgwt.client.rpc.RPCResponse#STATUS_SERVER_TIMEOUT
 * STATUS_SERVER_TIMEOUT} to detect <code>hiddenFrame</code> transport
 * errors.
 */
define("STATUS_TRANSPORT_ERROR", -90);

/**
 * This response code only occurs when using the HTTP proxy. It is issued by
 * the proxy servlet when the target host is unknown (ie, cannot be resolved
 * through DNS). This response probably indicates that you are attempting to
 * contact a nonexistent server (though it might mean that you have DNS
 * problems).
 */
define("STATUS_UNKNOWN_HOST_ERROR", -91);

/**
 * Indicates that the client attempted an update or remove operation without
 * providing primary key field(s)
 */
define("STATUS_UPDATE_WITHOUT_PK_ERROR", -9);

/**
 * Indicates a validation failure on the server. See the error handling
 * section in {@link com.smartgwt.client.rpc.RPCManager RPCManager
 * documentation} for more information.
 */
define("STATUS_VALIDATION_ERROR", -4);

define("STATUS_NOT_FOUND_REGISTER", -1000);
